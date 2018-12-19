const fs = require('fs-extra');
const R = require('ramda');

const findMissing = async ({ max, src }) => {
  const isSrcExists = await fs.pathExists(src);
  if (!isSrcExists) {
    throw new Error(`Directory ${src} not exists`);
  }

  const filenames = await fs.readdir(src);
  if (!filenames.length) {
    throw new Error(`Directory ${src} is empty`);
  }

  const items = R.pipe(
    R.map(filename => {
      const name = filename.split('.')[0];
      const [code, positionAndPhoto = ''] = name.split('-');
      const [position, photo] = positionAndPhoto.split('_').map(Number);
      if (
        !code ||
        !position ||
        !photo ||
        Number.isNaN(position) ||
        Number.isNaN(photo)
      ) {
        throw new Error(`Bad filename: ${filename}`);
      }
      return { code, position, photo };
    }),
    R.sort((a, b) => a.position - b.position),
  )(filenames);

  const uniqueCodes = R.pipe(
    R.map(R.prop('code')),
    R.uniq,
  )(items);

  if (uniqueCodes.length > 1) {
    const codes = uniqueCodes.join(', ');
    throw new Error(
      `There is more than one vendor code in directory: ${codes}`,
    );
  }

  const errors = [];

  const positionsWithoutFirstPhoto = R.pipe(
    R.groupBy(({ code, position }) => `${code}-${position}`),
    R.reject(photos => photos.filter(item => item.photo === 1).length),
    R.keys,
  )(items);

  if (positionsWithoutFirstPhoto.length) {
    const missings = positionsWithoutFirstPhoto.join(', ');
    errors.push(`[X] Missing first photos for items: ${missings}`);
  }

  const positions = items.map(R.prop('position'));

  const minPosition = 101;
  const maxPosition = max || R.last(items).position;
  const properPositions = Array(maxPosition - minPosition + 1)
    .fill()
    .map((_, i) => i + minPosition);

  const missingPositions = properPositions.filter(
    position => !positions.includes(position),
  );

  if (missingPositions.length) {
    const missings = missingPositions.join(', ');
    errors.push(
      `[X] In range from ${minPosition} to ${maxPosition} there are missing positions: ${missings}}`,
    );
  }

  if (errors.length) {
    throw new Error(`\n${errors.join('\n')}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[V] There is no missing positions in range from ${minPosition} to ${maxPosition}`,
    );
  }
};

// eslint-disable-next-line no-console
module.exports = args => findMissing(args).catch(error => console.error(error));
