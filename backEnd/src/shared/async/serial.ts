// Runs tasks one after another, in the order they arrive: edits that read a
// note and write it back would otherwise drop each other's changes. A failed
// task doesn't stop the ones queued after it.
export const serial = () => {
    let queue: Promise<unknown> = Promise.resolve()
    return <T>(task: () => Promise<T>): Promise<T> => {
        const run = queue.then(task)
        queue = run.catch(() => {})
        return run
    }
}
