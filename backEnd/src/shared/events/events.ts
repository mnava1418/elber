// Catalog of every event in the app: name -> payload. This is the contract
// between modules; publishers and subscribers only share these types.
// Events are named after something that already happened: <module>.<past_tense>.
export interface AppEvents {
    // resetLink is a credential: never log it.
    'users.password_reset_requested': {email: string, resetLink: string}
}

export type EventName = keyof AppEvents
