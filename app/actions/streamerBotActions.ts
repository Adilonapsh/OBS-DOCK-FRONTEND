export const updateTitle = (newTitle: string, game?: string) => {
    console.log(`Title updated to: ${newTitle}${game ? `, Game: ${game}` : ''}`);
}

export const updateDescription = (newDescription: string) => {
    console.log(`Description updated to: ${newDescription}`);
}

export const createPoll = (question: string, options: string[], duration: number) => {
    console.log(`Poll created with question: ${question}, options: ${options.join(", ")}, duration: ${duration}s`);
}
