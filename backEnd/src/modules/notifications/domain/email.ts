// A provider-agnostic email. The sender (From) is a delivery detail, so the
// infrastructure adapter sets it.
export interface Email {
    to: string
    subject: string
    html: string
    // Plain-text version for clients that don't render HTML.
    text: string
}
