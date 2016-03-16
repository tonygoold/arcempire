var IntegerVariable = function (name, defaultValue) {
    this.name = name;
    this.type = "System.Int32";
    this.value = defaultValue;
};
var CountdownEventVariable = function (name, count) {
    this.name = name;
    this.type = "System.Threading.CountdownEvent";
    this.value = count;
};
var ManualResetEventVariable = function (name, value) {
    this.name = name;
    this.type = "System.Threading.ManualResetEventSlim";
    this.value = value;
};
var BarrierVariable = function (name, participantCount) {
    this.name = name;
    this.type = "System.Threading.Barrier";
    this.value = participantCount;
    this.numberOfParticipants = participantCount;
    this.hasArrived = [];
    this.phase = 0;
};
var SemaphoreVariable = function(name, value) {
    this.name = name;
    this.type = 'System.Threading.SemaphoreSlim';
    this.value = value;
};
var QueueVariable = function(name, innerType, value) {
    this.name = name;
    this.type = 'System.Collections.Generic.Queue<' + innerType + '>';
    this.value = value;
};
var ObjectVariable = function(name) {
    this.name = name;
    this.type = 'System.Object';
};
var RefCountVariable = function(name, ownership) {
	this.name = name;
	this.type = 'ArcObject'
	this.value = null;
	if (ownership) {
		this.ownership = ownership;
	}
	else {
		this.ownership = "strong";
	}
};
var RefCountObject = function(name) {
	this.name = name;
	this.refCount = 1;
	this.deallocating = false;
};
RefCountObject.prototype.retain = function() {
	if (!this.deallocating) {
		this.refCount += 1;
	}
};
RefCountObject.prototype.release = function() {
	if (this.deallocating) {
		throw new RefCountError("Attempt to release a deallocated object.");
	}
	this.refCount -= 1;
	if (this.refCount == 0) {
		this.deallocating = true;
	}
};
var RefCountError = function(message) {
	Error.call(message);
}
RefCountError.prototype = Object.create(Error.prototype);
var ArcAutoreleasePool = function() {
	this.objects = [];
};
ArcAutoreleasePool.prototype.add = function(object) {
	if (object !== null) {
		this.objects.push(object);
	}
};
ArcAutoreleasePool.prototype.drain = function(threadState, globalState) {
	this.objects.forEach(function(object) {
		object.release();
	});
	this.objects = [];
};
/**
 * Returns the variable value in human-readable form.
 * @param variable A variable.
 * @returns string Its value in human form.
 */
var ToString = function(variable) {
    var type = variable.type;
    var value = variable.value;
    switch (type) {
        case "System.Threading.CountdownEvent":
            return value == 0 ? "[event set]" : (value == 1 ? "[waits for one more signal]" : "[waits for " + value + " more signals]");
        case "System.Threading.ManualResetEventSlim":
            return "[" + (value ? "signaled" : "nonsignaled" ) + "]";
        case "System.Threading.Barrier":
            return "[phase " + variable.phase + ", waiting for " + value + " threads]";
        case "System.Object":
            return "";
        case "System.Threading.SemaphoreSlim":
            return "[counter: " + value + "]";
		case "ArcObject":
			return value === null ? "[null]" : (value.deallocating ? "[deallocating]" : "[object refcount: " + value.refCount + "]");

    }
    if (type.indexOf('System.Collections.Generic.Queue') == 0) {
        return "[number of enqueued items: " + value + "]";
    }
    return null;
};