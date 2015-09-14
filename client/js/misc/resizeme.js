/* L2P iframe resizing */

window.onresize = function(){
    window.parent.postMessage(
        Math.max(document.documentElement.scrollHeight, document.documentElement.offsetHeight,
            document.body.scrollHeight, document.body.offsetHeight), "*");
};

window.onload = function() {
    window.onresize();
};

$(document).on('click', function () {
    setTimeout(function () {
        window.onresize();
    }, 300);
});

$(function () { // hackyhackhack bullshit
    setTimeout(function () {
        window.onload();
    }, 1000);
});
