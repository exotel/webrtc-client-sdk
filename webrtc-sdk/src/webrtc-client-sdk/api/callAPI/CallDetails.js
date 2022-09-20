export var CallDetails = {
    callId: '',
    remoteId: '',
    remoteDisplayName: '',
    callDirection: '',
    callState: '',
    callDuration: '',
    callStartedTime: '',
    callEstablishedTime: '',
    callEndedTime: '',
    callAnswerTime: '',
    callEndReason: '',
    sessionId: '',

    setCallDetails: function (callId,remoteId,remoteDisplayName,callDirection,
        callState,callDuration, callStartedTime, callEstablishedTime, callEndedTime, callAnswerTime, callEndReason, sessionId) {
            this.callId = callId;
            this.remoteId = remoteId;
            this.remoteDisplayName = remoteDisplayName;
            this.callDirection = callDirection;
            this.callState = callState;
            this.callDuration = callDuration;
            this.callStartedTime = callStartedTime;
            this.callEstablishedTime = callEstablishedTime;
            this.callEndedTime = callEndedTime;
            this.callAnswerTime = callAnswerTime;
            this.callEndReason = callEndReason;
            this.sessionId = sessionId;
        },
    getCallId: function(){
        return this.callId;
    },
    getRemoteId: function(){
        return  this.remoteId;
    },
    getRemoteDisplayName: function() {
        return this.remoteDisplayName;
    },
    getCallDirection: function() {
        return this.callDirection;
    },
    getCallDuration: function() {
        return this.callDuration;
    },
    getCallEstablishedTime: function() {
        return this.callEstablishedTime;
    },
    getCallStartedTime: function() {
        return  this.callStartedTime;
    },
    getCallEndedTime: function() {
        return this.callEndedTime;
    },
    getSessionId: function() {
        return this.sessionId;
    },
    getCallDetails: function(){
        let callDetailsObj = {
            callId: this.callId,
            remoteId: this.remoteId,
            remoteDisplayName: this.remoteDisplayName,
            callDirection: this.callDirection,
            callState: this.callState,
            callDuration: this.callDuration,
            callStartedTime: this.callStartedTime,
            callEstablishedTime: this.callEstablishedTime,
            callEndedTime: this.callEndedTime,
            callAnswerTime: this.callAnswerTime,
            callEndReason: this.callEndReason,
            sessionId: this.sessionId,
        }
        return callDetailsObj;
    }
}