const defaultSettings = {
  sound_enabled: true,
  highscore: 0,
  fullscreen: false, // Sync default with launch flag
  free_play: false, // if free play is true - do not show insert credits message. 
  rotation: false,
  grid_rows: 15,
  grid_columns: 7,
  major_prize_row: 0,
  minor_prize_row: 4,
  sfx_path: "https://lambda.vgmtreasurechest.com/soundtracks/stacker-arcade-gamerip-2004",
  electron_menu_bar: false, // used for debugging.
};

module.exports = defaultSettings;
