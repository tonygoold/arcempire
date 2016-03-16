function startLevelCreator(level) {
	return function() {
		navigateToLevel(level);
	}
}

var wasLevelCompleted = function(levelId) {
	return localStorage.getItem('level_' + levelId);
};

var scrollLevelIntoView = function(levelId) {
	console.log('scrolling to display level', levelId);
	$('#level-' + levelId)[0].scrollIntoView();
};

var returnToMainMenu = function() {
	var mainArea = $('#mainarea');
	mainArea.html("");
	$("#alert").hide();

	var logo = $("<img src='img/logo.png' id='logo'>");
	var logoRight = $("<img src='img/logo.png' id='logoRight'>");
	var heading = $("<h1 id='game'>ARC Empire</h1>");
	var subheading = $("<h2 id='subtitle'>Exploring Automatic Reference Counting</h2>");
	var introText = $("<div id='introtext'>Welcome to <b>ARC Empire</b>, an Objective-C centric fork of The Deadlock Empire!<br><br>Try out the levels below to explore Automatic Reference Counting (ARC) and see if you can force errors. The first four levels are tutorials, while the final level provides an actual challenge.</div>");

	// mainArea.append(logo);
	// mainArea.append(logoRight);
	mainArea.append(heading);
	mainArea.append(subheading);
	mainArea.append($('<div class="clearboth"></div>'));
	mainArea.append(introText);

	var nextToPlay = getNextQuestLevel();

	var makeLevelBox = function(levelId) {
		var level = levels[levelId];
		if (!level) {
			console.log("ERROR: No such level: ", levelId);
			return $('<div></div>');
		}
		var source = $('<div class="mainMenuLevel"></div>');
		source.attr('id', 'level-' + levelId);
		if (wasLevelCompleted(levelId)) {
			source.addClass('completed');
			source.append('<span class="menu-completion-icon glyphicon glyphicon-ok"></span>');
		} else if (levelId == nextToPlay) {
			source.addClass('nextToPlay');
			source.append('<span class="menu-next-to-play-icon glyphicon glyphicon-tower"></span>');
		} else {
			source.addClass('not-special');
			source.append('<span class="menu-not-special-icon"></span>');
		}
		source.append("<div class='mainMenuLevelCaption'>" + level.name + "</div>");
		source.append("<div class='mainMenuLevelDescription'>" + level.shortDescription + "</div>");
		source.css({cursor: 'pointer'});
		source.click(startLevelCreator(levelId));
		return source;
	};

	for (var campaignKey in campaign) {
		var quest = campaign[campaignKey];
		if (quest.name == "Debugging Levels" && !debugMode) {
			continue;
		}
		var heading = $('<h2 class="menu-heading"></h2>');
		heading.text(quest.name);
		mainArea.append(heading);
		var questDescription = $('<div class="menu-subheading"></div>');
		questDescription.html(quest.description);
		mainArea.append(questDescription);
		for (var i = 0; i < quest.levels.length; i++) {
			var levelId = quest.levels[i];
			var source = makeLevelBox(levelId);
			mainArea.append(source);
		}
	}

	var clearButton = $('<button class="btn btn-danger"><span class="glyphicon glyphicon-floppy-remove"></span>&nbsp;Clear progress</button>');
	clearButton.click(clearProgressAction);


	var feedbackButton = $('<button class="btn btn-info"><span class="glyphicon glyphicon-envelope"></span>&nbsp;Submit feedback</button>');
	feedbackButton.click(function () {
		window.open('https://docs.google.com/forms/d/1IAbT86UWM1DkKdiVd1F7OXn8IlswnrUth7wavRAORHY/viewform?c=0&w=1', '_blank');
	});

	var clearButtonArea = $('<div style="text-align: right; margin-top: 5em;"></div>');
	// clearButtonArea.append(feedbackButton);
	// clearButtonArea.append("&nbsp;");
	clearButtonArea.append(clearButton);

	mainArea.append(clearButtonArea);
};
