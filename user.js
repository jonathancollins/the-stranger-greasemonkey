// ==UserScript==
// @name           Registered Commenter Filter for Slog and Line Out
// @description    Adds a "hide" link to make comments by that person invisible
// @version        1.1.2
// @author         Jon Collins
// @copyright      2010 Jon Collins
// @attribution    Original idea was from Dennis Bratland
// @namespace      http://joncollins.name/
// @include        http://slog.thestranger.com/*/archives/*
// @include        http://lineout.thestranger.com/*/archives/*
// @include        http://www.thestranger.com/seattle/Comments?*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @require        http://sizzlemctwizzle.com/updater.php?id=48588
// ==/UserScript==

//
// Version 1.1.2
//
// * Clicking 'hide' or unchecking a box only acts on that user's comments (it was
//   hiding comments that had been opened by clicking a collapsed bar)
//
// * No longer interferes with the Stranger's built-in Registered/Unregistered
//   filters
//
// * Hide link is inserted after user website icon, if it exists
//
// Version 1.1.1
//
// * Added link to a google search on each filtered commenter
//
// Version 1.1.0
//
// * Utilized the built-in collapse controls to allow the user to show
//   a filtered comment
//
// * Included sizzlemctwizzle's auto update script
//
// Version 1.0.2
//
// * Added support for Line Out
//
// Version 1.0.1
//
// * Fixed "hide" link appearing next to anonymous comments. This might be
//   a useful feature in the anonymous comment script, but I left it out of
//   this one because anonymous commenter names can be sock-puppeted, etc.
//   This script is supposed to deal with registered commenters.
//
// Version 1.0.0
//
// * Initial release

var authorStatus = getAuthorStatus();

$(document).ready(function() {
    hideComments();
    injectAuthorCheckboxes();
    injectHideLinks();
});

function hideComments() {
    if ($("#BrowseComments").size() > 0) {
        $(".commentByline .commentAuthor").each(
            function(i) {
                // get the id of the comment div
                // also for use showing the collapse control

                var commentId  = $(this).parent().parent().attr('id');
                var collapseId = commentId + '-collapsed';

                // there is no need to check anonymity here
                // anonymous comments cannot sock puppet registered names

                var author = $(this).html();

                // hide the comment and show collapse control if author is set to invisible
                if (authorStatus[author] !== undefined) {
                    $('#' + commentId).hide();
                    $('#' + collapseId).show();
                }
            }
        );
    }
}

function setAuthorVisibility(author, visible) {
    if ($("#BrowseComments").size() > 0) {
        $(".commentByline .commentAuthor").each(
            function(i) {
                var currentAuthor = $(this).html();
                if (currentAuthor == author) {
                    // get the id of the comment div
                    // also for use showing the collapse control

                    var commentId  = $(this).parent().parent().attr('id');
                    var collapseId = commentId + '-collapsed';

                    // hide or show the comment and collapse control

                    if (visible === false) {
                        $('#' + commentId).hide();
                        $('#' + collapseId).show();
                    }
                    else {
                        $('#' + commentId).show();
                        $('#' + collapseId).hide();
                    }
                }
            }
        );
    }
}

function injectAuthorCheckboxes() {
    // create a sorted author list array
    var authors = new Array();
    for (var author in authorStatus) {
        authors.push(author);
    }

    if ($('#BrowseComments').size() > 0) {
        if (authors.length == 0) {
            //try to remove existing list
            $('#FilterCommenters').remove();
            return;
        }

        //sort case insensitive
        authors.sort(function(x, y) {
            var a = x.toUpperCase();
            var b = y.toUpperCase();

            if (a > b) {
                return 1;
            }

            if (a < b) {
                return -1;
            }

            return 0;
        });

        // create the checkboxes and surrounding div
        var div = $(document.createElement('div'))
            .css('background', '#FFFFFF none repeat scroll 0 0')
            .css('float', 'left')
            .css('margin', '10px 0')
            .css('padding', '10px')
            .css('text-align', 'left');

        $(document.createElement('h2'))
            .addClass('sitesection')
            .text('Hidden Commenters')
            .appendTo(div);

        for (var i = 0; i < authors.length; i++) {
            getAuthorCheckbox(authors[i]).appendTo(div);
        }

        // remove existing list
        $('#FilterCommenters').remove();

        div.attr('id', 'FilterCommenters');

        // append updated list to right sidebar
        var sidebar = $('#gridSpanningIsland');
        if (sidebar.size() > 0) {
            div.css('width', '330px');
            div.appendTo($('#gridSpanningIsland'));
        }

        // it's called something different on comment popups
        var sidebar = $('#gridRightSidebar');
        if (sidebar.size() > 0) {
            div.css('width', '280px');
            div.appendTo($('#gridRightSidebar'));
        }
    }
}

function getAuthorCheckbox(author) {
    var div = $(document.createElement('div'));

    var input = $(document.createElement('input'))
        .attr('type', 'checkbox')
        .attr('value', author)
        .attr('checked', 'checked')
        .bind('change', function(e) {
            if (this.checked == true) {
                // this shouldn't actually happen...
                authorStatus[this.value] = true;
                setAuthorVisibility(this.value, false);
            }
            else {
                delete authorStatus[this.value];
                setAuthorVisibility(this.value, true);

                // ...because of this
                injectAuthorCheckboxes();
            }

            saveAuthorStatus();
        })

    //checkbox
    input.appendTo(div);

    //space
    $(document.createTextNode(' ')).appendTo(div);

    //link
    var a = $(document.createElement('a'))
            .attr('href', 'http://www.google.com/search?q=%22' + author.replace('/ /', '%20') + '%22%20site%3A' + document.domain + '&tbo=s&tbs=qdr:y,sbd:1')
            .attr('target', '_blank');
    $(document.createTextNode(author)).appendTo(a);
    a.appendTo(div);

    return div;
}


function injectHideLinks() {
    if ($("#BrowseComments").size() > 0) {

        $(".commentByline .commentAuthor").each(
            function(i) {
                //skip adding "hide" link next to anonymous comments
                if ($(this).hasClass('anonymous')) return;

                var author = $(this).html();

                var span = $(document.createElement('span'));

                var a = $(document.createElement('a'))
                    .text('hide')
                    .bind('click', function(e) {
                        authorStatus[author] = true;
                        setAuthorVisibility(author, false);
                        injectAuthorCheckboxes();
                        saveAuthorStatus();
                    })

                $(document.createTextNode(' [')).appendTo(span);
                a.appendTo(span);
                $(document.createTextNode(']')).appendTo(span);

                $('.commentDate', $(this).parent()).before(span);
            }
        );

    }
}


function saveAuthorStatus() {
    GM_setValue('authorStatus', authorStatus.toSource());
}

function getAuthorStatus() {
    var authorStatus = GM_getValue('authorStatus');

    if (authorStatus === undefined) {
        authorStatus = new Object();
    }
    else {
        authorStatus = eval(authorStatus);
    }

    return authorStatus;
}
