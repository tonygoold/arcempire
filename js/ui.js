function showMessage(caption, text) {
    $('#alertCaption').html(caption);
    $('#alertText').html(text);
    $('#alert').show();
}

var updateProgramCounters = function() {
	var threadCount = level.threads.length;
	$('.instruction').each(function() {
		$(this).removeClass('current-instruction');
	});
	$('.expansion').each(function() {
		$(this).css({display: "none"});
	});
	// update program counters
	for (var i = 0; i < threadCount; i++) {
		var threadState = gameState.threadState[i];
		var pc = threadState.programCounter[0];

		if (pc < level.threads[i].instructions.length) {
			$('#instruction-' + i + '-' + pc).addClass('current-instruction');
		}

		if (level.threads[i].instructions[pc] instanceof ExpandableInstruction) {
			$('#instruction-' + i + '-' + pc + '-expansion').css({display: (threadState.expanded ? 'block' : 'none')});

			if (threadState.expanded) {
				$('#instruction-' + i + '-' + pc + '-sub' + threadState.programCounter[1]).addClass('current-instruction');
			}
		}
	}
};

var updateGlobalVariables = function() {
	var area = $('.global-state');
	area.html("");
	for (var key in gameState.globalState) {
		var variable = gameState.globalState[key];
		var representation = $('<div class="variable"></div>');
		representation.append($('<span class="type"></span>').text(variable.type));
		representation.append($('<span class="name"></span>').text(variable.name));
		representation.append("=");

		var valueRepr;
		if (variable.type == "String") {
			valueRepr = '"' + variable.value + '"';
		}

		representation.append($('<span class="value"></span>').text(valueRepr));
		area.append(representation);
	}
};

var redraw = function() {
	updateProgramCounters();
	updateGlobalVariables();
	undoButton.attr('disabled', undoHistory.length == 0);

	for (var i = 0; i < getThreadCount(); i++) {
		threadButtons[i].step.attr('disabled', isThreadFinished(i));

		var program = level.threads[i].instructions;
		var threadState = gameState.threadState[i];
		var currentInstruction = program[threadState.programCounter[0]];
		var isExpandable = (currentInstruction instanceof ExpandableInstruction);
		console.log(isExpandable);
		threadButtons[i].expand.attr('disabled', !(isExpandable && !threadState.expanded));
	}
};