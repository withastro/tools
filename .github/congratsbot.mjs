import { EOL } from 'node:os';

const { COMMIT_AUTHOR, COMMIT_ID, COMMIT_MESSAGE, GITHUB_REPO } = process.env;
if (!COMMIT_AUTHOR || !COMMIT_ID || !COMMIT_MESSAGE || !GITHUB_REPO) {
  throw new Error(
    'Missing input.\n' +
      'Required environment variables: COMMIT_AUTHOR, COMMIT_ID, COMMIT_MESSAGE, GITHUB_REPO\n\n' +
      'Available environment variables: ' +
      Object.keys(process.env).join(', ') +
      '\n'
  );
}
setDiscordMessage(COMMIT_AUTHOR, COMMIT_ID, COMMIT_MESSAGE, GITHUB_REPO);

/**
 * @param {string} author The name of the commit author
 * @param {string} id The commit ID
 * @param {string} commitMsg A full commit message
 * @param {string} repo The full GitHub repo name to link to, e.g. `'withastro/starlight'`
 */
function setDiscordMessage(author, id, commitMsg, repo) {
  const commitMessage = commitMsg
    .split('\n')[0]
    .replaceAll('`', '')
    .replaceAll('-', '–');

  const coAuthors = commitMsg
    .split('\n')
    .slice(2)
    .filter((line) => line.match(/Co-authored-by: (.+) <.+>/i))
    .map((line) => line.match(/Co-authored-by: (.+) <.+>/i)[1]);

  let coAuthorThanks = '';
  if (coAuthors.length) {
    const uniqueCoAuthors = [...new Set(coAuthors)];
    const names = makeList(uniqueCoAuthors).filter(name => 
		{
			if(name == "github-actions[bot]")
				return false;
			return true;
		});
    coAuthorThanks = '\n' + getCoAuthorsMessage(names);
  }

  const defaultEmoji = ['🎉', '🎊', '🧑‍🚀', '🥳', '🙌', '🚀'];
  const userEmoji = process.env.EMOJIS?.split(',');
  const emoji = pick(
    userEmoji && userEmoji.length > 0 ? userEmoji : defaultEmoji
  );

  setGitHubActionOutput(
    'DISCORD_MESSAGE',
    `${emoji} **Merged!** ${author}: [\`${commitMessage}\`](<https://github.com/${repo}/commit/${id}>)${coAuthorThanks}`
  );
}

/**
 * Based on `setOutput` and `issueCommand` in `@actions/core` to avoid the additional dependency.
 * @see https://github.com/actions/toolkit/blob/a6bf8726aa7b78d4fc8111359cca5d538527b239/packages/core/src/core.ts#L192
 * @see https://github.com/actions/toolkit/blob/a6bf8726aa7b78d4fc8111359cca5d538527b239/packages/core/src/command.ts#L23
 * @param {string} name Name of the output value to set
 * @param {string} value Value to set
 */
function setGitHubActionOutput(name, value) {
  process.stdout.write(EOL);
  process.stdout.write(`::set-output name=${name}::` + escapeData(value) + EOL);
}

/**
 * Based on https://github.com/actions/toolkit/blob/a6bf8726aa7b78d4fc8111359cca5d538527b239/packages/core/src/command.ts#LL80C1-L85C2
 * @param {string} str
 */
function escapeData(str) {
  return str.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

/**
 * Generate a list like `'foo, bar and baz'` from an array
 * like `['foo', 'bar', 'baz']`.
 * @param {string[]} list List of words to format
 */
function makeList(list) {
  if (list.length === 1) return list[0];
  return list.slice(0, -1).join(', ') + ' & ' + list.at(-1);
}

/**
 * Pick a random item from an array of items.
 * @param {string[]} items Items to pick from
 */
function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get a randomised fun thank you message for co-authors.
 * @param {string} names Names of co-authors to be thanked
 */
function getCoAuthorsMessage(names) {
  /** @type {string[]} */
  let messages = [];
  try {
    messages = JSON.parse(process.env.COAUTHOR_TEMPLATES || '[]');
  } catch (err) {
    console.error(
      'Failed to parse `COAUTHOR_TEMPLATES` as JSON. Falling back to default templates.\n ',
      err
    );
  }
  if (!messages || messages.length === 0) {
    messages = [
      'Thanks <names> for helping! ✨',
      '<names> stepped up to lend a hand — thank you! 🙌',
      '<names> with the assist! 💪',
      'Couldn’t have done this without <names>! 💜',
      'Made even better by <names>! 🚀',
      'And the team effort award goes to… <names>! 🏆',
      'Featuring contributions by <names>! 🌟',
    ];
  }
  const chosenMessage = pick(messages);
  return '_' + chosenMessage.replace('<names>', names).trim() + '_';
}
