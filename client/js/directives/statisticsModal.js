// This file is part of YABS. See License for more information

/**
 * Provides a Modal Element. Use &#60;statistics-modal&#62;&#60;/statistics-modal&#62; <br>
 * It fully takes care of displaying the panic statistics for the room in scope.room. Therefor it needs to be embedded into a
 * scope that has a room set.
 * The ModalId is "#statModal"
 *
 * @module Directives/statisticsModal
 * @requires Services/rooms
 * @requires Services/errorService
 */

clientControllers.directive('statisticsModal', ['$timeout', 'rooms', "errorService", function($timeout, rooms, errorService){
	return {
		restrict: 'E',
		templateUrl: 'course_statistics.html',
		controller:  "courseController",
		link: {
			pre: function(scope){
				//define default data for initialization and define options
				scope.chartist = {};
	            scope.chartist.options = {
	                lineSmooth: false, // disable interpolation
	                axisX: {
	                    showLabel: true,
	                    labelInterpolationFnc: function (val, index) {
	                        var dataLength = scope.chartist.lineData.labels.length;
	                        var dist = Math.ceil(dataLength/10);
	                        if (dataLength - index > 1 || dataLength < 7) { // have a padding from chart right border
	                            return (index % dist === 0 ? val : '');
	                        } else {
	                            return '';
	                        }
	                    }
	                },
	                axisY: {
	                    labelInterpolationFnc: function(val) { // do not show half panics
	                        return (val % 1 === 0 ? val : ' ');
	                    }
	                } 
        		};
        		try{
	        		if (InstallTrigger !== 'undefined') { // really bad firefox detection
	        			// until now firefox needs a fixed width and height due to some svg api implementation
	        			scope.chartist.options.height = '400px';
	        			scope.chartist.options.width = '700px';
	        			$('.ct-chart').removeClass('ct-major-eleventh');
	        		}
        		} catch (e) {
        			// lol
        		}

			},
			post: function(scope){
				// as this function is post-load binded by angular default we can now do all the initialization
	            $("#statModal").off().on("shown.bs.modal", function() {
	                scope.drawChart();
	                var timer = setInterval(function(){
	                    scope.drawChart(); // redraw every 60 seconds
	                }, 60 * 1000); 
	                $('#statModal').on('hide.bs.modal', function(){
	                    clearInterval(timer);
	                });
	            });

                /**
                 * Draws the chart into modal
                 */
				scope.drawChart = function() {
		            rooms.getPanicGraph(scope.room).then(function(data) {
		                var labels = [];
		                var values = [];
		                for (var i = 0; i < data.graph.length; i++) {
		                    var date = (new Date(data.graph[i].time)).toLocaleTimeString();
		                    labels.push(date);
		                    values.push({ value: data.graph[i].panics, meta: date });
		                }
		                if (values.length !== 0) {
			                scope.chartist.lineData = { labels: labels, series: [{
			                        name: "Panics",
			                        data: values }
			                ]};
		                }
                        if (data.graph.length <= 0) {
                            errorService.drawError("Es liegen bisher keine Daten vor. Starten Sie eine Vorlesung um Daten zu sammeln.", true);
                        }
		                // modified chartist example
		                var $chart = $('.ct-chart');

		                var $toolTip = $chart
		                    .find('.tooltip');

		                $('.ct-chart').on('mouseenter', '.ct-point', function() {
		                    var $point = $(this);
		                    var count = $point.attr('ct:value') || 0; // || 0 as chartist currently gives undefined on 0 value
		                    var time = $point.attr('ct:meta');
		                    // this is bad but scope variables are too slow. gotta go for an angular module
		                    $toolTip.html('<div class="panel-heading">' + time + 
		                        '</div><div class="panel-body">' + count + ' Panics</div>').show();
		                });

		                $chart.on('mouseleave', '.ct-point', function() {
		                    $toolTip.hide();
		                });

		                $chart.on('mousemove', function(event) {
		                    $toolTip.css({
		                        left: (event.offsetX || event.originalEvent.layerX) - $toolTip.width() / 2 + 1,
		                        top: (event.offsetY || event.originalEvent.layerY) - $toolTip.height() - 15
		                    });
		                });

		                $timeout(function() {
		                    window.dispatchEvent(new Event("resize"));
		                    // Rerenders chartist (crappy solution, but the directive doesnt allow direct access)
		                    return true;
		                });                                
		            });
		        };
			}
		}
	};
}]);