/* L2P iframe resizing */

window.onresize = function(){
    window.parent.postMessage(
        Math.max(document.documentElement.scrollHeight, document.documentElement.offsetHeight,
            document.body.scrollHeight, document.body.offsetHeight), "*");
};

window.onload = function() {
    window.onresize();
};

$(document).onclick(function () {
    window.onresize();
});

$(function () { // hackyhackhack bullshit
    setTimeout(function () {
        window.onload();
    }, 1000);
});
