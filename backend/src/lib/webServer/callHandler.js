class CallHandler {
    maxPingLag = 10;
    pingInterval = 3 * 1000;
    /**
     * [ { userId, socketId, pingLag } ]
     */
    callers = [];
    /**
     * [ { fromId, toId, callObj, status, time } ]
     *  @param  status "pending" | "active"
     */
    calls = [];

    io;
    pingingCallers = false;
    pushingCalls = false;

    addCaller(userId, socketId, friendId, callObj, io) {
        this.io = io;
        const caller = this.callers.find(c => c.userId == userId);
        if (caller && caller.socketId != socketId) {
            return false;
        }
        if (!caller) {
            this.callers.push({ userId, socketId, friendId, pingLag: 0 });
        }
        if (!this.updateCallStatus(userId, friendId, callObj)) {
            return false;
        }
        if (!this.pingingCallers) {
            this.pingCallers();
        }
        if (!this.pushingCalls) {
            this.pushCalls();
        }
        return true;
    }

    updateCallStatus(userId, friendId, callObj) {
        const ids = [userId, friendId];
        const calls = this.calls.filter(
            call => ids.includes(call.fromId) || ids.includes(call.toId)
        );
        if (calls.length > 1) {
            return false;
        }
        if (calls.length > 0) {
            const call = calls[0];
            if (!(ids.includes(call.fromId) && ids.includes(call.toId))) {
                return false;
            }
            if (call.toId == userId) {
                call.status = 'active';
                const toCaller = this.callers.find(caller => caller.userId == call.toId);
                this.io
                    .to(toCaller.userId)
                    .except(toCaller.socketId)
                    .emit('callEnd', { user: call.fromId });
            }
        } else {
            this.calls.push({
                fromId: userId,
                toId: friendId,
                callObj,
                status: 'pending',
                time: new Date().getTime(),
            });
        }
        return true;
    }

    pushCalls() {
        this.pushingCalls = true;
        this.calls?.forEach(call => {
            if (call.status == 'pending') {
                //const caller = this.callers.find(c => c.userId == call.fromId);
                //console.log(caller.userId);
                //    this.io.to(caller.socketId).emit('calling', { ...call.callObj, user2: call.toId, caller: true });
                this.io.to(call.toId).emit('calling', call.callObj);
            } else {
                const fromCaller = this.callers.find(caller => call.fromId == caller.userId);
                const toCaller = this.callers.find(caller => call.toId == caller.userId);
                this.io.to(fromCaller.socketId).emit('calling', {
                    ...call.callObj,
                    username: call.callObj.username2,
                    user: toCaller.userId,
                    caller: true,
                    peerid: toCaller.socketId,
                });
                this.io.to(toCaller.socketId).emit('calling', call.callObj);
            }
        });
        if (this.calls.length <= 0) {
            this.pushingCalls = false;
            return;
        }
        setTimeout(() => this.pushCalls(), 1000);
    }

    pingCallers() {
        this.pingingCallers = true;
        this.callers?.forEach(caller => {
            caller.pingLag++;
            this.io.to(caller.socketId).emit('pingCall', caller);
        });
        const expiredCallers = this.callers.filter(caller => caller.pingLag > this.maxPingLag);
        expiredCallers.forEach(caller => {
            this.io.to(caller.socketId).emit('callEnd', { user: caller.friendId });
            this.removeCaller(caller.userId, caller.socketId);
            //let callFriend = this.callers.find(friend => friend.userId === caller.friendId);
            this.io.to(caller.friendId).emit('callEnd', { user: caller.userId });
        });
        this.callers = this.callers.filter(
            caller =>
                !expiredCallers.some(
                    exCall => exCall.userId == caller.userId || exCall.friendId == caller.userId
                )
        );
        if (this.callers.length <= 0) {
            this.pingingCallers = false;
            return;
        }

        setTimeout(() => this.pingCallers(), this.pingInterval);
    }

    callerPing(userId, socketId) {
        const caller = this.callers.find(c => c.userId == userId && c.socketId == socketId);
        if (caller) {
            caller.pingLag = 0;
        }
    }

    removeCaller(userId, socketId) {
        const caller = this.callers.find(c => c.userId == userId && c.socketId == socketId);
        if (!caller) {
            const call = this.calls.find(c => c.toId == userId);
            if (!call || call?.status != 'pending') {
                return false;
            }
        }
        this.calls = this.calls.filter(call => ![call.fromId, call.toId].includes(userId));
        this.callers = this.callers.filter(c => !(c.userId == userId && c.socketId == socketId));
        return true;
    }
}

module.exports = new CallHandler();
