'use strict';
const fs = require('fs');
const path = require('path');
const color = require('color');
const yaml = require('js-yaml');

const filepaths = {
  backgrounds: path.resolve(__dirname, 'backgrounds'),
  gifs: path.resolve(__dirname, 'pokecursors')
};

const colorSchemes = {
  types: path.resolve(__dirname, 'types.yml'),
  pokemon: path.resolve(__dirname, 'pokemon.yml'),
  trainers: path.resolve(__dirname, 'trainers.yml')
};

function getUserOptions(configObj) {
  return Object.assign({}, {
    get pokemon() {
      if (Array.isArray(configObj.pokemon)) {
        return configObj.pokemon[Math.floor(Math.random() * configObj.pokemon.length)];
      }
      return configObj.pokemon || 'pikachu';
    },
    get poketab() {
      return (configObj.poketab || 'false') === 'true';
    },
    get unibody() {
      return (configObj.unibody || 'true') !== 'false';
    }
  });
}

function getRandomTheme(category) {
  const index = Math.floor(Math.random() * (Object.keys(category).length));
  const name = Object.keys(category)[index];
  return [name, category[name]];
}

function getThemes() {
  const themes = {};
  Object.keys(colorSchemes).forEach(category => {
    Object.assign(themes, yaml.safeLoad(fs.readFileSync(colorSchemes[category], 'utf8')));
  });
  return themes;
}

function getThemeColors(theme) {
  const themes = getThemes();
  const name = theme.trim().toLowerCase();
  if (name === 'random') {
    return getRandomTheme(themes.pokemon);
  }
  if (Object.prototype.hasOwnProperty.call(themes, name)) {
    // Choose a random theme from the given category -- i.e. `fire`
    return getRandomTheme(themes[name]);
  }
  if (Object.prototype.hasOwnProperty.call(themes.pokemon, name)) {
    // Return the requested pokemon theme -- i.e. `lapras`
    return [name, themes.pokemon[name]];
  }
  // Got non-existent theme name thus resolve to default
  return ['pikachu', themes.pokemon.pikachu];
}

function getMediaPaths(theme) {
  const [imagePath, gifPath] = [[], []];
  imagePath.push(...[path.join(filepaths.backgrounds, theme), '.png']);
  gifPath.push(...[path.join(filepaths.gifs, theme), '.gif']);
  if (process.platform === 'win32') {
    return [imagePath, gifPath].map(item => item.join('').replace(/\\/g, '/'));
  }
  return [imagePath.join(''), gifPath.join('')];
}

exports.decorateConfig = config => {
  // Get user options
  const options = getUserOptions(config);
  const [themeName, colors] = getThemeColors(options.pokemon);
  const [imagePath, gifPath] = getMediaPaths(themeName);

  // Set theme colors
  const {primary, secondary, tertiary, unibody} = colors;
  const background = options.unibody ? unibody : primary;
  const selection = color(primary).alpha(0.3).string();
  const transparent = color(secondary).alpha(0).string();
  const activeTab = color(secondary).isDark() ? '#FAFAFA' : '#383A42';
  const tab = color(activeTab).darken(0.1);

  // Set poketab
  const tabContent = options.poketab ? gifPath : '';

  const syntax = {
    backgroundColor: transparent,
    borderColor: background,
    cursorColor: secondary,
    foregroundColor: secondary,
    selectionColor: selection,
    colors: {
      black: tertiary,
      red: secondary,
      green: tertiary,
      yellow: secondary,
      blue: secondary,
      magenta: secondary,
      cyan: secondary,
      white: secondary,
      lightBlack: tertiary,
      lightRed: secondary,
      lightGreen: secondary,
      lightYellow: secondary,
      lightBlue: secondary,
      lightMagenta: secondary,
      lightCyan: secondary,
      lightWhite: secondary
    }
  };

  return Object.assign({}, config, syntax, {
    termCSS: config.termCSS || '',
    css: `
      ${config.css || ''}
      .terms_terms {
        background: url("file://${imagePath}") center;
        background-size: cover;
      }
      .header_header, .header_windowHeader {
        background-color: ${background} !important;
      }
      .tab_textActive .tab_textInner::before {
        content: url("file://${tabContent}");
        position: absolute;
        right: 0;
        top: -4px;
      }
      .tabs_nav .tabs_list {
        border-bottom: 0;
      }
      .tabs_nav .tabs_title,
      .tabs_nav .tabs_list .tab_tab {
        color: ${secondary};
        border: 0;
      }
      .tab_icon {
        color: ${background};
        width: 15px;
        height: 15px;
      }
      .tab_icon:hover {
        background-color: ${background};
      }
      .tab_shape {
        color: ${secondary};
        width: 7px;
        height: 7px;
      }
      .tab_shape:hover {
        color: ${secondary};
      }
      .tab_active {
        background-color: ${activeTab};
      }
      .tabs_nav .tabs_list .tab_tab:not(.tab_active) {
        background-color: ${tab};
      }
      .tabs_nav .tabs_list {
        color: ${background};
      }
      .tab_tab::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: ${secondary};
        transform: scaleX(0);
        transition: none;
      }
      .tab_tab.tab_active::before {
        transform: scaleX(1);
        transition: all 400ms cubic-bezier(0.0, 0.0, 0.2, 1)
      }
      .terms_terms .terms_termGroup .splitpane_panes .splitpane_divider {
        background-color: ${secondary} !important;
      }
    `
  });
};
