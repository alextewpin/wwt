const fs = require('fs-extra');
const R = require('ramda');

const path = require('path');

const getIsDirectory = async p => {
  try {
    return (await fs.lstat(p)).isDirectory();
  } catch (e) {
    return false;
  }
};

const findCampaignItems = async args => {
  const [list, src, out] = R.map(path.resolve, [args.list, args.src, args.out]);

  const isSrcExists = await fs.pathExists(src);
  if (!isSrcExists) {
    throw new Error(`Directory ${src} not exists`);
  }

  const srcItems = (await fs.readdir(src))
    .map(fullName => ({
      name: path.parse(fullName).name.toLowerCase(),
      fullName,
    }))
    .filter(({ name }) => !name.startsWith('.'));
  if (!srcItems.length) {
    throw new Error(`Directory ${src} is empty`);
  }

  const isDirectoryStats = await Promise.all(
    srcItems.map(({ fullName }) => getIsDirectory(path.resolve(src, fullName))),
  );

  const filenames = srcItems.filter((_, i) => !isDirectoryStats[i]);
  if (!filenames.length) {
    throw new Error(`Directory ${src} do not contains files`);
  }

  const dirnames = srcItems.filter((_, i) => isDirectoryStats[i]);

  const isListExists = await fs.pathExists(list);
  if (!isListExists) {
    throw new Error(`File ${list} not exists`);
  }

  const listContent = ((await fs.readFile(list, 'utf8')) || '')
    .split('\n')
    .map(R.trim)
    .filter(R.identity)
    .map(R.toLower);
  if (!listContent.length) {
    throw new Error('List file is empty');
  }

  const matches = [];
  const unmatchedListItems = [];

  listContent.forEach(listItem => {
    const matchedFilenames = filenames
      .filter(({ name }) => name.includes(listItem))
      .map(R.prop('fullName'));
    if (matchedFilenames.length) {
      matches.push(matchedFilenames);
    } else {
      unmatchedListItems.push(listItem);
    }
  });

  const filesToCopy = R.pipe(
    R.flatten,
    R.uniq,
  )(matches);

  await fs.emptyDir(out);

  await Promise.all(
    filesToCopy.map(name =>
      fs.copy(path.resolve(src, name), path.resolve(out, name)),
    ),
  );

  const messages = [];

  if (dirnames.length) {
    const unexpectedDirs = dirnames.map(R.prop('fullName')).join(', ');
    messages.push(`[warn] Unexpected directories: ${unexpectedDirs}`);
  }
  if (unmatchedListItems.length) {
    messages.push(
      `[warn] List items without matches: ${unmatchedListItems.join(', ')}`,
    );
  }
  messages.push(`[ok] Copied ${filesToCopy.length} files`);

  // eslint-disable-next-line no-console
  console.log(messages.join('\n'));
};

module.exports = args =>
  findCampaignItems(args).catch(error => console.error(error)); // eslint-disable-line no-console
