class CameraList {
    // Store sorted list of all cameras

    constructor() {
        this.devices_unknown = [];
        this.devices_back = []; // list of back cameras
        this.devices_front = []; // list of front cameras

        // [0, this.devices_back.length) - back
        // [this.devices_back.length; this.devices_back.length + this.devices_front.length) - front
        this.next_id = 0;
    }

    get length() {
        return this.devices_back.length + this.devices_front.length + this.devices_unknown.length;
    }

    push_unknown(device_id) {
        const unknown_i = this.devices_unknown.indexOf(device_id);
        const back_i = this.devices_back.indexOf(device_id);
        const front_i = this.devices_front.indexOf(device_id);
        if (unknown_i >= 0 || back_i >= 0 || front_i >= 0) return;
        this.devices_unknown.push(device_id);
    }

    push(device_id, is_back) {
        // Check if element are in the correct array
        const unknown_i = this.devices_unknown.indexOf(device_id);
        const back_i = this.devices_back.indexOf(device_id);
        const front_i = this.devices_front.indexOf(device_id);
        if (is_back && back_i >= 0 && front_i < 0 && unknown_i < 0) return;
        if (!is_back && back_i < 0 && front_i >= 0 && unknown_i < 0) return;

        // Deleting element from all lists
        if (unknown_i >= 0) {
            this.devices_unknown.splice(unknown_i, 1);  // remove
        }
        if (back_i >= 0) {
            this.devices_back.splice(back_i, 1);  // remove
            if (this.next_id > back_i) this.next_id--;
        }
        if (front_i >= 0) {
            this.devices_front.splice(front_i, 1); // remove
            if (this.next_id > front_i) this.next_id--;
        }

        // Insert element
        if (is_back) {
            let i = this.devices_back.length;
            if (this.next_id < i) i = this.next_id;
            this.devices_back.splice(i, 0, device_id); // insert
            this.next_id++;
        }
        else
        {
            let i = this.next_id;
            if (i < this.devices_back.length) i = this.length;
            this.devices_front.splice(i, 0, device_id); // insert
            if (i >= this.next_id) this.next_id++;
        }

        this.next_id %= this.length;
    }

    has_unknown() {
        return this.devices_unknown.length > 0;
    }

    get_unknown() {
        return this.devices_unknown[this.devices_unknown.length-1];
    }

    get_next()
    {
        let res;
        if (this.next_id < this.devices_back.length)
            res = this.devices_back[this.next_id];
        else
            res = this.devices_front[this.next_id - this.devices_back.length];
        this.next_id = (this.next_id + 1) % this.length;
        return res;
    }

    get_dback()
    {
        return this.devices_back;
    }

    get_dfront()
    {
        return this.devices_front;
    }
}


class Camera {

    constructor() {
        this.handlers = {};
        this._first_open = true;
        this.device_list = new CameraList();
    }

    /*
        List of events: open(stream), close(), error(where, err)
     */
    on(event, handler) {
        this.handlers[event] = handler;
    }

    get is_supported() {
        // read end of https://developer.mozilla.org/ru/docs/Web/API/MediaDevices/getUserMedia
        // see https://github.com/xdumaine/enumerateDevices
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
    }

    get number_of_devices() {
        return this.device_list.length;
    }

    async close() {
        if (this.stream === undefined) return;
        await sleep(1000);  // very important! Do not remove! See https://gitlab.com/inno_baam/baam/-/issues/94
        if ("close" in this.handlers) this.handlers["close"]();
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = undefined;
    }

    async getUserMedia(constrains, repeat=10) {
        constrains.width = { ideal: 1920 };
        constrains.height = { ideal: 1080 };

        for (let i = repeat; i >= 0; i--) {
            try {
                return await navigator.mediaDevices.getUserMedia({audio: false, video: constrains});
            } catch (e) {
                // On some devices android stack returns an error when we try to reopen the device too fast
                if (e.name === "AbortError" && i > 0) {
                    if ("error" in this.handlers) this.handlers["error"](
                        `get an AbortError. Wait 1000ms before retry ${i+1}/${repeat}`, e);
                    await sleep(1000);
                    continue;
                }
                throw e;
            }
        }
    }

    async open_next() {
        await this.close();

        if (this._first_open) {
            // Open any camera
            try {
                this.stream = await this.getUserMedia({facingMode: {ideal: "environment"}}, 0);
                if ("open" in this.handlers) this.handlers["open"](this.stream);
                const settings = this.stream.getTracks()[0].getSettings();
                this.device_list.push(settings.deviceId, settings.facingMode === "environment");
            }
            catch (e) {
                if ("error" in this.handlers) this.handlers["error"](
                    `Error while opening any camera`, e);
                // TODO: Need to somehow work with permission denied
                return;
            }
        }

        // Enumerate all devices
        (await navigator.mediaDevices.enumerateDevices()).forEach(m => {
            if (m.kind !== 'videoinput') return;
            if ('getCapabilities' in m) {
                const caps = m.getCapabilities();
                if ('facingMode' in caps)
                    this.device_list.push(m.deviceId, caps.facingMode.some(v => v === "environment"))
                else
                    this.device_list.push_unknown(m.deviceId)
            }
            else
                this.device_list.push_unknown(m.deviceId)
        });

        if (this._first_open) {
            this._first_open = false;
            return;
        }

        while (this.device_list.has_unknown())
        {
            const device_id = this.device_list.get_unknown();
            try {
                this.stream = await this.getUserMedia({deviceId: {exact: device_id }, facingMode: { exact: "environment" }});
                if ("open" in this.handlers) this.handlers["open"](this.stream);
                this.device_list.push(device_id, true);
                return;
            }
            catch (e) {
                if (e.name === "OverconstrainedError" || e.name === "ConstraintNotSatisfiedError") {
                    this.device_list.push(device_id, false);
                }
                else {
                    this.device_list.push(device_id, true);
                    if ("error" in this.handlers) this.handlers["error"](
                        `Error while opening environment camera with id=${device_id}. Trying next camera`, e);
                }
            }
        }


        // Open next camera
        for (let i = 0; i < this.device_list.length; i++) {
            const device_id = this.device_list.get_next();
            try {
                this.stream = await this.getUserMedia({deviceId: {exact: device_id }});
                if ("open" in this.handlers) this.handlers["open"](this.stream);
                const settings = this.stream.getTracks()[0].getSettings();
                this.device_list.push(device_id, settings.facingMode === "environment");
                return;
            }
            catch (e) {
                if ("error" in this.handlers) this.handlers["error"](
                    `Error while opening camera with id=${device_id}. Trying next camera`, e);
                this.device_list.push(device_id, false);
            }
        }
    }
}