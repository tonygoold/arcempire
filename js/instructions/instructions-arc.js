var ArcAllocateExpression = function (type) {
	this.evaluate = function(threadState, globalState) {
		return new RefCountObject(nextObjectName(type));
	};
	this.code = "[[" + type + " alloc] init]";
}

var ArcTemporaryExpression = function (name) {
	this.evaluate = function(threadState, globalState) {
		var tempVar = threadState.localVariables[name];
		return tempVar ? tempVar.value : null;
	};
	this.code = name;
}

var ArcAutoreleasePoolInstruction = function () {
	this.code = "@autoreleasepool {";
	this.tooltip = "Begins a new autorelease pool.";
	this.execute = function(threadState, globalState) {
		threadState.arcAutoreleasePools.push(new ArcAutoreleasePool());
		moveToNextInstruction(threadState);
	};
}

var EndArcAutoreleasePoolInstruction = function () {
	this.code = "}";
	this.tooltip = "Ends the current autorelease pool.";
	this.execute = function(threadState, globalState) {
		threadState.arcAutoreleasePools.pop().drain(threadState, globalState);
		moveToNextInstruction(threadState);
	};
}

var ArcAssignInstruction = function (left, expression) {
	var minorInstructions = [
		new ArcAssignmentToTemp("temp", expression),
		new ArcRetainInstruction(new ArcTemporaryExpression("temp")),
		new ArcAssignmentToTemp("lvalue", new VariableExpression(left)),
		new ArcPrimitiveAssignment(left, new ArcTemporaryExpression("temp")),
		new ArcReleaseInstruction(new ArcTemporaryExpression("lvalue"))
	];
	var v = new ExpandableInstruction(left + " = " + expression.code + ";", minorInstructions);
	v.tooltip = "[Expandable] Assigns the value of the right-side expression to the variable on the " +
	"left using automatic reference counting. This operation is non-atomic.";
	return v;
};

var ArcAssignAutoreleasingInstruction = function (left, expression) {
	var minorInstructions = [
		new ArcAssignmentToTemp("temp", expression),
		new ArcRetainAutoreleaseInstruction(new ArcTemporaryExpression("temp")),
		new ArcPrimitiveAssignment(left, new ArcTemporaryExpression("temp"))
	];
	var v = new ExpandableInstruction(left + " = " + expression.code + ";", minorInstructions);
	v.tooltip = "[Expandable] Assigns the value of the right-side expression to the variable on the " +
	"left using automatic reference counting. "
	return v;
}

var ArcPrimitiveAssignment = function (left, expression) {
	this.code = left + " = " + expression.code + ";";
	this.tooltip = "Assigns the value of the right-side expression to the variable on the left. This operation is atomic.";
	this.execute = function(threadState, globalState) {
		globalState[left].value = expression.evaluate(threadState, globalState);
		moveToNextInstruction(threadState);
	};
};

var ArcAssignmentToTemp = function (name, expression) {
	this.code = name + " = " + expression.code + ";";
	this.tooltip = "Assigns the value of the right-side expression to the thread-local temporary variable on the left.";
	this.execute = function(threadState, globalState) {
		var value = expression.evaluate(threadState, globalState);
		if (value instanceof RefCountObject) {
			var tempVar = new RefCountVariable(name);
			tempVar.value = value;
			threadState.localVariables[name] = tempVar;
		} else if (name in threadState.localVariables) {
			delete threadState.localVariables[name];
		}
		moveToNextInstruction(threadState);
	};
};

var ArcRetainInstruction = function (expression, manual) {
	if (manual) {
		this.code = "[" + expression.code + " retain];";
	}
	else {
		this.code = "objc_retain(" + expression.code + ");";
	}
	this.tooltip = "Increases the retain count of the specified object.";
	this.execute = function(threadState, globalState) {
		var object = expression.evaluate(threadState, globalState);
		if (object && !object.deallocating) {
			object.refCount += 1;
		}
		moveToNextInstruction(threadState);
	};
};
var ObjcRetainInstruction = function (expression) {
	ArcRetainInstruction.call(this, expression, true);
}
var ArcReleaseInstruction = function (expression, manual) {
	if (manual) {
		this.code = "[" + expression.code + " release];";
	}
	else {
		this.code = "objc_release(" + expression.code + ");";
	}
	this.tooltip = "Decreases the retain count of the specified object.";
	this.execute = function(threadState, globalState) {
		var object = expression.evaluate(threadState, globalState);
		if (object) {
			try {
				object.release();
			}
			catch (ex) {
				if (ex instanceof RefCountError) {
					win(ex.message);
				}
				else {
					throw ex;
				}
			}
		}
		moveToNextInstruction(threadState);
	};
}
var ObjcReleaseInstruction = function (expression) {
	ArcReleaseInstruction.call(this, expression, true);
}
var ArcRetainAutoreleaseInstruction = function (expression, manual) {
	if (manual) {
		this.code = "[[" + expression.code + " retain] autorelease];";
	}
	else {
		this.code = "objc_retainAutorelease(" + expression.code + ");";
	}
	this.tooltip = "Retains and autoreleases the specified object.";
	this.execute = function(threadState, globalState) {
		var object = expression.evaluate(threadState, globalState);
		if (object) {
			object.retain();
			var pools = threadState.arcAutoreleasePools;
			pools[pools.length - 1].add(object);
		}
		moveToNextInstruction(threadState);
	};
}
var ObjcRetainAutoreleaseInstruction = function (expression) {
	ArcRetainAutoreleaseInstruction.call(this, expression, true);
};
