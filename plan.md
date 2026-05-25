# Theme: Hatsune Mikufyer

## Phase 1: Planning

### Interactions: 
* User uploading image → System horribly mikufies the image with PNGs of her (temporary image on site, no actual upload) → Download button
    * Mikufication: randomly places 1-5 PNGs of Hatsune Miku on the image, some overlapping and are randomly stretched, randomly placed, and randomly rotated
* Leek click: when clicked, a rotating leek falls down the screen and stays at the bottom of the page. Has a clear button so your PC wouldn't explode
* Embed my Voca-Personal [Spotify playlist](https://open.spotify.com/playlist/5ZBJFx4PAfb5zQJsVAg4Vz?si=c061a15b705444bd)
* Miku wallpaper auto-carousel
* Miku PNG displayed and gives a sound effect and bounces (electron - MikuXP.mp3) when clicked
* Background music: Triple Baka with volume controller
* Cursor has a rainbow trail and sparkles everywhere
* Credits footer for resources used (text list only, credit in filename)
* 1/500 chance per second for a full screen MIKUDAYO jumpscare with max volume and immediately fading out after 0.7 seconds

### JS Features:
* Variables (let/const): Filenames of images/audio/video
* Conditionals (if/else): Check if the image is uploaded, if the leek is clicked, if the volume is 0, etc.
* Functions: Separate functions for image mikufication, leek falling, wallpaper carousel, sound effects, background music, and volume control
* DOM manipulation: Image upload, leek click, wallpaper carousel, sound effects, background music, volume control
* Events: Leek fall, volume control, sound effect trigger, image upload
* Array or Objects (to store data bank): Image files uploaded by user for mikufication

### Wireframe:
* See: wireframe.png

## Phase 2: Building

### A. HTML Structure
* Keep HTML semantic
* Link CSS in <head> and Script below <body>
* Strict Rule: NO inline JS allowed

### B. CSS Styling
* Go wild, use the 2008s aesthetic with rainbows and shit. Don't use rounded corners, by the way

### C. JavaScript Interactivity
* All logic must be in script.js
* Use meaningful variable names and functions
* Functions should be reusable and specific

## Phase 3: Review
* No console errors and page is intuitive for first-time users