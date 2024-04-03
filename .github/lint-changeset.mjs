import nlp from 'compromise';

export default async function main() {
    const text = 'Fixes an issue with the implementation of a specific feature.'
    const isPresentTense = await lint(text)
    console.log({ isPresentTense });
}

await main();

async function lint(text) {
    const doc = nlp(text);
    return doc.sentences().toPresentTense().text() === text;
}
