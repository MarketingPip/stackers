# 🕹️ OpenStacker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Web | Windows | macOS | Linux](https://img.shields.io/badge/platform-Web%20%7C%20Win%20%7C%20Mac%20%7C%20Linux-blueviolet)](https://github.com/YourUsername/OpenStacker)

**OpenStacker** is a fully customizable, open-source recreation of the legendary arcade stacking challenge. Unlike commercial machines that use "payout ratios" to force misses, OpenStacker is built on **True-Skill Logic**—if you hit the button on time, you win.

Designed for players, developers, and arcade builders alike.

---

## 🚀 Features

* **Cross-Platform:** Play instantly in your [Browser](#), or download native builds for Windows, Linux, and macOS.
* **Arcade Ready:** Native support for arcade front-ends like **LaunchBox**, **RetroPie**, and **BigBox**.
* **Hardware Integration:** Includes a built-in Serial Bridge to communicate with **Arduino/ESP32**. 
    * Trigger physical coin acceptors.
    * Activate prize-drop solenoids or ticket dispensers.
    * Sync external WS2812B (NeoPixel) LED strips with game events.
* **Customizable Difficulty:** Modify block speeds, grid size, and "gravity" through a simple JSON config or the in-game editor.
* **Zero Rigging:** 100% deterministic timing. The win window is consistent and fair.

---

## 🛠️ DIY Arcade Build (Arduino)

OpenStacker can act as the "brain" for a physical arcade cabinet. By enabling **Hardware Mode** in the settings, the game sends and receives signals via USB Serial:

| Signal | Action |
| :--- | :--- |
| `INPUT_BUTTON` | Triggers the stack (Map to a physical arcade button) |
| `OUT_WIN_MAJOR` | Sent when the top row is reached (Trigger prize motor) |
| `OUT_WIN_MINOR` | Sent when the mid-tier is reached (Dispense tickets) |
| `OUT_GAME_OVER` | Resets physical cabinet lights |

Check the `/hardware` folder for the `.ino` sketch to flash to your Arduino.

---

## 📥 Installation

### Desktop
1. Download the latest release for your OS from the [Releases Tab](https://github.com/YourUsername/OpenStacker/releases).
2. Extract the ZIP.
3. Run `OpenStacker.exe` (Windows) or `./OpenStacker` (Linux).

### Web / Self-Hosting
Simply host the contents of the `/dist` folder on any web server (GitHub Pages, Netlify, etc.) or open `index.html` in your browser.

---

## ⌨️ Controls
* **Space / Enter:** Stack Block
* **R:** Restart Game
* **F:** Toggle Fullscreen
* **Esc:** Menu / Settings

---

## 🤝 Contributing

We love contributions! Whether it's a new theme, better physics, or expanded hardware support:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Built with ❤️ for the Arcade Community.** *Disclaimer: This project is a fan-made tribute and is not affiliated with LAI Games.*
