#!/usr/bin/env node

const yargs = require('yargs');

const findCampaignItems = require('../findCampaignItems');
const findMissings = require('../findMissings');

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    ['find-campaign-items', 'fci'],
    'Find and campaing items and copy them to directory',
    {
      list: {
        alias: 'l',
        describe: 'Path to list with names to match',
        type: 'string',
        demandOption: true,
      },
      src: {
        alias: 's',
        describe: 'Path to directory with items',
        type: 'string',
        demandOption: true,
      },
      out: {
        alias: 'o',
        describe: 'Path to output directory',
        type: 'string',
        demandOption: true,
      },
    },
    findCampaignItems,
  )
  .command(
    ['find-missings', 'fm'],
    'Find missing positions',
    {
      max: {
        alias: 'm',
        describe: 'Maximum expected position',
        type: 'string',
      },
      src: {
        alias: 's',
        describe: 'Path to directory with items',
        type: 'string',
        demandOption: true,
      },
    },
    findMissings,
  )
  .help()
  .demandCommand().argv;
