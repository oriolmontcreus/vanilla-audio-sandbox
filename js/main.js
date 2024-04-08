import {SnackBar} from './snackbar.js';

$(function () {
    $.getJSON('./sounds/soundsDictionary.json', function (sounds) {
        initializeDrumPad(sounds);
        initializeControlPad();
        initializeDropFileArea(sounds);
        initializeChannelRack(sounds);
        $('#loader').fadeOut('slow');
        
        $(document).keydown(function (e) {
            var sound = sounds.find(sound => sound.key === e.which);
            if (sound) {
                var button = $(`#${sound.name}`);
                playSound(sound, button);
            }
        });
    });
});

function playSound(sound, button) {
    var audio = new Audio(sound.path);
    var volume = Number($(".level").val()) / 100;
    audio.volume = volume;
    audio.play();

    button.css('background-color', 'rgb(250, 58, 58)');

    audio.onended = function () {
        button.css('background-color', '');
    };
}

function makeDraggable(element) {
    element.draggable({
        revert: "invalid",
        containment: "#drum-pad-panel",
        start: function () {
            if ($(".toggle-input").is(":checked")) {
                $(this).css('cursor', 'move');
                $(this).data('originalPosition', $(this).parent().position());
                return true;
            }
            return false;
        },
        stop: function () {
            $(this).css('cursor', '');
        }
    });
}

function addClickHandler(element, sounds) {
    element.click(function () {
        var soundName = $(this).attr("id");
        var sound = sounds.find(sound => sound.name === soundName);
        playSound(sound, $(this));
    });
}

function createButton(sound, sounds) {
    var button = $(`<div class="drumpad-button" id="${sound.name}">${sound.name}<div class="key" style="font-size: 30px; text-align: center;">${String.fromCharCode(sound.key)}</div></div>`);
    addClickHandler(button, sounds);
    makeDraggable(button);
    return button;
}

function initializeDrumPad(sounds) {
    for (var i = 0; i < 9; i++) {
        var cell = $('<div class="cell"></div>');
        $("#drum-pad-panel").append(cell);
    }

    sounds.forEach((sound, i) => {
        var button = createButton(sound, sounds);
        $(".cell").eq(i).append(button);
    });

    var switchButton = $('<div class="toggle-switch"><input class="toggle-input" id="toggle" type="checkbox"><label class="toggle-label" for="toggle"></label></div><span style="margin-left: -60px; font-weight: bold; color: #bbb">Drag Buttons</span>');
    $("#drum-pad-panel").append(switchButton);

    $(".drumpad-button").draggable({
        revert: "invalid",
        containment: "#drum-pad-panel",
        start: function () {
            if ($(".toggle-input").is(":checked")) {
                $(this).css('cursor', 'move');
                $(this).data('originalPosition', $(this).parent().position());
                return true;
            }
            return false;
        },
        stop: function () {
            $(this).css('cursor', '');
        }
    });

    $(".cell").droppable({
        accept: ".drumpad-button",
        drop: function (event, ui) {
            var droppedButton = ui.draggable;
            var droppedButtonOriginalPosition = droppedButton.data('originalPosition');
            var existingButton = $(this).children('.drumpad-button');

            if (existingButton.length > 0) {
                existingButton.detach().appendTo(droppedButton.parent());
            }

            droppedButton.detach().appendTo($(this)).css({
                top: '0px',
                left: '0px'
            });
        }
    });

    $("#drum-pad-panel").css({ left: 0, top: 0 }).draggable({ handle: "#handle", containment: "body" });
}

var bpm = 75;
function initializeControlPad() {
    var controlPad = $('<div class="control-pad"></div>');
    controlPad.append($('<div id="handle">Control Pad</div>'));
    $("body").append(controlPad);

    controlPad.append($('<div id="volume-label" style="text-align:start; margin-left:42px; color: #bbb">Volume: <b>75%</b></div>'));
    controlPad.append($('<label id="volume-slider" class="slider"><input type="range" class="level" min="0" max="100" value="75"><div id="volume-icon"></div></label>'));
    $("#volume-icon").load("./Media/Icons/volume-icon.svg");

    controlPad.append($('<div id="bpm-label" style="text-align:start; margin-left:42px; color: #bbb">BPM: <b>75</b></div>'));
    controlPad.append($('<label id="bpm-slider" class="slider"><input type="range" class="level" min="0" max="200" value="75" style="margin-left: 20px;"><div id="bpm-icon"></div></label>'));
    $("#bpm-icon").load("./Media/Icons/clock.svg");

    $(".level").on('input', function () {
        var value = Number($(this).val());
        if ($(this).parent().attr('id') === 'volume-slider') {
            $("audio").each(function () {
                this.volume = value / 100;
            });
            $("#volume-label").html("Volume: <b>" + value + "%</b>");
        } else if ($(this).parent().attr('id') === 'bpm-slider') {
            bpm = value;
            $("#bpm-label").html("BPM: <b>" + value + "</b>");
        }
    });

    $(".control-pad").css({ left: 375, top: 50 }).draggable({ handle: "#handle", containment: "body" });
}

function initializeDropFileArea(sounds) {
    var dropFileArea = $('<div class="drop-file-area"></div>');
    dropFileArea.append($('<div id="handle">Upload Sound</div>'));
    $("body").append(dropFileArea);

    var dropArea = $('<div id="drop-area"><h3 class="drop-text">Drag and Drop Sounds Here</h3></div>');
    dropFileArea.append(dropArea);

    $(".drop-file-area").css({ left: 345, top: -210 }).draggable({ handle: "#handle", containment: "body" });

    dropArea.on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    dropArea.on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var files = e.originalEvent.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            saveFile(file, sounds);
        }
    });
}

function saveFile(file, sounds) {
    if (!file.type.startsWith('audio')) {
        new SnackBar({
            message: 'Only audio files are allowed',
            dismissible: true,
            status: 'error',
        });
        return;
    }

    var url = URL.createObjectURL(file);
    var nextKey = sounds.length + 49;
    var fileNameWithoutExtension = file.name.split('.')[0];
    updateDrumPadSounds({
        name: fileNameWithoutExtension,
        path: url,
        key: nextKey
    }, sounds);
    new SnackBar({
        message: `The sound effect "${fileNameWithoutExtension}" has been added successfully!`,
        dismissible: true,
        status: 'success',
    });
}

function updateDrumPadSounds(newSound, sounds) {
    sounds.push(newSound);
    var button = createButton(newSound, sounds);
    $(".cell:empty").first().append(button);

    var channelRack = $('.channel-rack');
    var soundRow = createSoundRow(newSound);
    soundRow.insertBefore(channelRack.find('.row').last());
}


//--------------------------------- CHANNEL RACK ---------------------------------

var isPlaying = false;
var currentColumn = 0;
var intervalId;
var numColumns = 16;

function createSoundIndicator(sound, i) {
    var column = $('<div class="column column-' + i + '"></div>');
    var button = $('<button class="sound-indicator" data-sound="' + sound.name + '"></button>')
    if ((i + 1) % 4 === 0) {
        button.addClass('compass-end');
    }
    button.click(function () {
        $(this).toggleClass('active');
    });
    column.append(button);
    return column;
}

function createSoundRow(sound) {
    var container = $('<div class="container"></div>');
    container.css('position', 'relative');

    var row = $('<div class="row"></div>');
    container.append(row);
    
    var soundNameDiv = $('<div class="sound-name"></div>');
    var soundNameText = $('<span class="sound-name-text" style="color: #bbb" >' + sound.name + '</span>');
    soundNameText.css({
        'position': 'absolute',
        'top': '+8px', 
        'left': '0'
    });
    soundNameDiv.append(soundNameText);
    row.append(soundNameDiv);

    var compasses = $('<div class="compasses"></div>');
    for (var i = 0; i < numColumns; i++) {
        compasses.append(createSoundIndicator(sound, i));
    }
    row.append(compasses);

    return container;
}

//Yes, this code its horrendous, but it works (DO NOT TRY AT HOME)
function adjustColumnIconSize() {
    var baseSize = 18;
    var baseMargin = 10;
    var adjustmentFactor = (16 - numColumns) / 4;

    var newSize = baseSize + (4 * adjustmentFactor);
    var newMargin = baseMargin + (2 * adjustmentFactor);

    $('.column-icon').css({
        'width': newSize + 'px',
        'height': newSize + 'px',
        'margin': newMargin + 'px',
    });
}

function redrawColumnIcons() {
    $('#column-icons-row').children('.column-icon').remove();

    for (var i = 0; i < numColumns; i++) {
        var circle = $('<div class="column-icon"></div>');
        circle.data('column', i);
        circle.click(function () {
            currentColumn = $(this).data('column'); 
            $('.column-icon').removeClass('highlight');
            $(this).addClass('highlight');
            updateHighlight();
        });
        $('#column-icons-row').append(circle);
    }
}

function addCompass(sounds) {
    numColumns += 4;
    $('.row').each(function() {
        for (var i = 0; i < 4; i++) {
            var index = $(this).children('.compasses').children().length;
            $(this).children('.compasses').append(createSoundIndicator(sounds[index % sounds.length], index));
        }
    });
    redrawColumnIcons();
    adjustColumnIconSize();

    //Yes, this code its horrendous, but it works (DO NOT TRY AT HOME)
    switch (numColumns) {
        case 20:
            $('.row').css('margin-left', '+=' + 10 + 'px');
            break;
        case 16:
            $('.row').css('margin-left', '-=' + 78 + 'px');
            break;
        case 12:
            $('.row').css('margin-left', '-=' + 156 + 'px');
            break;
        case 8:
            $('.row').css('margin-left', '-=' + 244 + 'px');
            break;
    }
}

function removeCompass() {
    numColumns -= 4;
    $('.row').each(function() {
        for (var i = 0; i < 4; i++) {
            $(this).children('.compasses').children().last().remove();
        }
    });
    redrawColumnIcons();
    adjustColumnIconSize();

    //Yes, this code its horrendous, but it works (DO NOT TRY AT HOME)
    switch (numColumns) {
        case 20:
        case 16:
            $('.row').css('margin-left', '-=' + 10 + 'px');
            break;
        case 12:
            $('.row').css('margin-left', '+=' + 78 + 'px');
            break;
        case 8:
            $('.row').css('margin-left', '+=' + 156 + 'px');
            break;
        case 4:
            $('.row').css('margin-left', '+=' + 244 + 'px');
            break;
    }
}

function createButtonControls(sounds) {

    var controlsRow = $('<div class="controlsRow" id="controlsRow"></div>');
    $(".channel-rack").append(controlsRow);

    var playButton = $('<button id="channelRackToggle"><div id="toggle-icon"></div></button>');
    $(".controlsRow").append(playButton);
    var iconDiv = $('#toggle-icon');
    $('#channelRackToggle').addClass('play-icon');

    let playSvg, pauseSvg;
    
    $.get('./Media/Icons/play.svg', function (data) {
        playSvg = $(data).find('svg');
        iconDiv.empty().append(playSvg);
    });

    $.get('./Media/Icons/pause.svg', function (data) {
        pauseSvg = $(data).find('svg');
    });

    var addButton = $('<button id="addCompass"></button>');
    $(".controlsRow").append(addButton);
    $("#addCompass").load("./Media/Icons/plus.svg");

    var removeButton = $('<button id="removeCompass"></button>');
    $(".controlsRow").append(removeButton);
    $("#removeCompass").load("./Media/Icons/minus.svg");

    addButton.click(function () {
        if (numColumns < 20)
            addCompass(sounds);
        else
            new SnackBar({
                message: 'You can only add up to 5 compasses',
                dismissible: true,
                status: 'error',
            });
    });

    removeButton.click(function () {
        if (numColumns > 4)
            removeCompass();
        else
            new SnackBar({
                message: 'You must have at least 1 compass',
                dismissible: true,
                status: 'error'
            });
    });

    playButton.click(function () {
        isPlaying = !isPlaying;
        clearInterval(intervalId);
        if (isPlaying) {
            var interval = 60000 / bpm;
            intervalId = setInterval(function() { playMusic(sounds); }, interval);
            $('#bpm-slider').addClass('disabled');
        } else {
            $('#bpm-slider').removeClass('disabled');
        }
        iconDiv.fadeOut(200, function () {
            $(this).empty().append(isPlaying ? pauseSvg : playSvg).fadeIn();
            $('#channelRackToggle').toggleClass('play-icon', !isPlaying);
        });
    });
}

function initializeChannelRack(sounds) {
    var channelRack = $('<div class="channel-rack"></div>');
    channelRack.append($('<div id="handle">Channel Rack</div>'));
    $("body").append(channelRack);

    sounds.forEach(sound => {
        channelRack.append(createSoundRow(sound));
    });

    var row = $('<div class="row" id="column-icons-row"></div>');
    row.append($('<div class="sound-name"></div>'));
    
    channelRack.append(row);
    redrawColumnIcons();
    createButtonControls(sounds);

    $(".channel-rack").css({ left: 590, top: 50 }).draggable({ handle: "#handle", containment: "body" });
}

function updateHighlight() {
    $('.column').css('background-color', '');
    $('.column-icon').css('background-color', 'white');
    $('.column-' + currentColumn).css('background-color', 'rgba(19, 151, 234, 0.5)');
    $('.column-icon').eq(currentColumn).css('background-color', 'rgba(19, 151, 234, 0.5)');
}

function playMusic(sounds) {
    updateHighlight();
    $('.column-' + currentColumn + ' .sound-indicator.active').each(function() {
        var soundName = $(this).data('sound');
        var sound = sounds.find(sound => sound.name === soundName);
        playSound(sound, $(this));
    });
    currentColumn = (currentColumn + 1) % numColumns;
}