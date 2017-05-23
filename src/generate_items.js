#!/usr/bin/env node

YAML = require('yamljs');
const consoleServices = YAML.load('console-services.yml');
const listItems = generate(consoleServices);
injectIntoXml(listItems);

function generate(consoleServices, ...parentCommands) {
  if (!consoleServices) {
    return [];
  }

  const flatMap = require('lodash.flatmap');
  return flatMap(consoleServices, ({command, description, icon, url, subpages}) => {

    const consoleService = (() => {
      if (parentCommands.length) {
        const rootCommand = parentCommands[0];
        return {
          title: `${parentCommands.join(' ')} ${command}`,
          arg: url,
          subtitle: `${parentCommands.join(' ')} - ${description}`,
          imagefile: icon || `${rootCommand}.png`,
        }
      }

      return {
        title: command,
        arg: url,
        subtitle: description,
        imagefile: icon || `${command}.png`,
      }
    })();

    console.log(consoleService.title);
    return [consoleService, ...generate(subpages, ...parentCommands, command)];
  });
}

function injectIntoXml(alfredProjects) {
  const plist = require('plist');
  const fs = require('fs-extra');
  const path = require('path');

  fs.copySync(path.resolve(`${__dirname}/../info.plist`), `${__dirname}/../info.plist.generatebackup`);
  const file = fs.readFileSync(`${__dirname}/../info.plist.generatebackup`, 'utf-8');
  const plistJson = plist.parse(file);
  plistJson.objects[1].config.items = JSON.stringify(alfredProjects);
  fixedPlistJson = fixPlistLibraryNullKey(plistJson);
  const updatedPlist = plist.build(fixedPlistJson)
  fs.writeFileSync(`${__dirname}/../info.plist`, updatedPlist);
}

function fixPlistLibraryNullKey(plistJson) {
  const traverse = require('traverse');
  traverse(plistJson).forEach(function(node) {
    if (node === null) {
      this.update('');
    }
  })
  return plistJson;
}
