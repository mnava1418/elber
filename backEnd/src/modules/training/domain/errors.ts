// Data that breaks a rule of the domain (a plan without routines, 9 days a
// week...). Its message says which rule, in English, for the model or the
// API's client.
export class InvalidTrainingDataError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidTrainingDataError'
    }
}

// Also for someone else's plan: for this user it doesn't exist.
export class PlanNotFoundError extends Error {
    constructor(planId: string) {
        super(`Plan ${planId} not found`)
        this.name = 'PlanNotFoundError'
    }
}

// There is one active plan at a time: the user closes it (in the page)
// before starting another.
export class PlanAlreadyActiveError extends Error {
    constructor() {
        super('There is already an active plan')
        this.name = 'PlanAlreadyActiveError'
    }
}

// Closed plans are history: they are neither edited nor closed again.
export class PlanClosedError extends Error {
    constructor(planId: string) {
        super(`Plan ${planId} is closed`)
        this.name = 'PlanClosedError'
    }
}

// A routine that isn't in the active plan.
export class RoutineNotFoundError extends Error {
    constructor(routineId: string) {
        super(`Routine ${routineId} not found in the active plan`)
        this.name = 'RoutineNotFoundError'
    }
}

export class SessionNotFoundError extends Error {
    constructor(date: string) {
        super(`No training session on ${date}`)
        this.name = 'SessionNotFoundError'
    }
}

export class MeasurementNotFoundError extends Error {
    constructor(measurementId: string) {
        super(`Measurement ${measurementId} not found`)
        this.name = 'MeasurementNotFoundError'
    }
}
