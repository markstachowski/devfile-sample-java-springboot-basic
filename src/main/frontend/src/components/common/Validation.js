class ValidationType {
    static ERROR = new ValidationType("error")
    static WARNING = new ValidationType("warning")

    constructor(name) {
        this.name = name;
    }
}

class Validation {
    constructor(id, message, type) {
        this.id = id;
        this.message = message;
        this.type = type;
        if (this.type === ValidationType.WARNING) {
            this.className = 'gg-notification-warning'
        } else if (this.type.name === ValidationType.ERROR) {
            this.className = 'gg-notification-error'
        }
    }
}

export {ValidationType, Validation}
