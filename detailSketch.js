let rawData;
let selectedAlbum = null;
let genreColors = {};

// Variabili globali per memorizzare le coordinate esatte del bottone "Torna indietro"
let btnX = 0, btnY = 0, btnW = 140, btnH = 36;

// Funzione per raggruppare i generi in macro-categorie
function getSimpleGenre(rawGenre) {
  let g = rawGenre.toLowerCase();
  
  if (g.includes('hip hop') || g.includes('rap') || g.includes('trap')) return 'Hip Hop / Rap';
  if (g.includes('electronic') || g.includes('ambient') || g.includes('techno') || g.includes('house') || g.includes('idm') || g.includes('synth') || g.includes('edm')) return 'Electronic';
  if (g.includes('metal') || g.includes('hardcore') || g.includes('punk')) return 'Metal / Punk';
  if (g.includes('jazz') || g.includes('blues') || g.includes('soul') || g.includes('funk') || g.includes('r&b')) return 'Jazz / Soul / R&B';
  if (g.includes('folk') || g.includes('country') || g.includes('singer-songwriter') || g.includes('acoustic')) return 'Folk / Country';
  if (g.includes('pop')) return 'Pop';
  if (g.includes('rock') || g.includes('indie rock') || g.includes('alternative') || g.includes('shoegaze') || g.includes('grunge') || g.includes('progressive')) return 'Rock / Alternative';
  
  let firstPrimary = rawGenre.split(",")[0].trim();
  return firstPrimary;
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let colorPalette = [
    '#66A9ED', '#E06C75', '#98C379', '#E5C07B', 
    '#C678DD', '#56B6C2', '#D19A66', '#BE5046', '#E0A96D', '#9381FF'
  ];
  let colorIndex = 0;

  rawData = await loadTable("rym_clean1.csv", ",", "header");

  for (let i = 0; i < rawData.getRowCount(); i++) {
    let rawGenre = rawData.getString(i, "primary_genres");
    let simpleGenre = getSimpleGenre(rawGenre);
    if (!genreColors[simpleGenre]) {
      genreColors[simpleGenre] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
  }

  // Leggiamo il parametro 'position' dall'URL
  let params = new URLSearchParams(window.location.search);
  let targetPosition = params.get('position');

  if (targetPosition) {
    for (let i = 0; i < rawData.getRowCount(); i++) {
      let posVal = rawData.getString(i, "position");
      if (String(posVal).trim() === String(targetPosition).trim()) {
        selectedAlbum = rawData.getRow(i);
        break;
      }
    }
  }

  if (!selectedAlbum && rawData.getRowCount() > 0) {
    selectedAlbum = rawData.getRow(0);
  }
}

function draw() {
  background(18, 18, 18);

  let halfWidth = width / 2;
  let centerY = height / 2;

  // --- 1. COLONNA SINISTRA: IL GLIFO (Vinile che esce dalla custodia) ---
  push();
  let centerX = halfWidth / 2 - 30; 

  let sleeveSize = 340; 
  let vinylSize = 320;  

  let displayGenre = "Genere";
  let coverColor = color(102, 169, 237);
  let titleText = "Album";
  let artistText = "Artista";

  if (selectedAlbum) {
    titleText = selectedAlbum.getString("release_name");
    artistText = selectedAlbum.getString("artist_name");
    let rawGenre = selectedAlbum.getString("primary_genres");
    displayGenre = getSimpleGenre(rawGenre);
    
    if (genreColors[displayGenre]) {
      coverColor = color(genreColors[displayGenre]);
    }
  }

  // Disco che esce sul lato destro
  push();
  translate(centerX + 95, centerY);
  
  fill(22, 22, 22);
  stroke(45);
  strokeWeight(2);
  ellipse(0, 0, vinylSize, vinylSize);

  noFill();
  stroke(38);
  strokeWeight(1);
  for (let r = vinylSize - 25; r > 80; r -= 20) {
    ellipse(0, 0, r, r);
  }

  fill(coverColor);
  noStroke();
  ellipse(0, 0, 110, 110);

  fill(18, 18, 18);
  ellipse(0, 0, 28, 28);
  pop();

  // Custodia quadrata
  push();
  translate(centerX, centerY);

  drawingContext.shadowOffsetX = 20;
  drawingContext.shadowOffsetY = 20;
  drawingContext.shadowBlur = 50;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.85)';

  fill(coverColor);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, sleeveSize, sleeveSize, 8);

  drawingContext.shadowBlur = 0;

  // Apertura tasca laterale
  fill(0, 0, 0, 75);
  noStroke();
  rect(sleeveSize/2 - 7, -sleeveSize/2 + 7, 7, sleeveSize - 14);

  // Banner inferiore per titolo e artista sulla copertina
  fill(18, 18, 18, 240);
  noStroke();
  rectMode(CORNER);
  rect(-sleeveSize/2, sleeveSize/2 - 110, sleeveSize, 110, 0, 0, 8, 8);

  fill(255);
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  let displayTitle = titleText.length > 22 ? titleText.substring(0, 20) + "..." : titleText;
  text(displayTitle, -sleeveSize/2 + 22, sleeveSize/2 - 85);

  fill(190);
  textSize(13);
  textStyle(NORMAL);
  let displayArtist = artistText.length > 26 ? artistText.substring(0, 24) + "..." : artistText;
  text(displayArtist, -sleeveSize/2 + 22, sleeveSize/2 - 52);

  // Badge del genere in alto a sinistra
  fill(18, 18, 18, 210);
  let genreTextW = textWidth(displayGenre.toUpperCase()) + 20;
  rect(-sleeveSize/2 + 18, -sleeveSize/2 + 18, genreTextW, 26, 4);
  fill(255);
  textSize(11);
  textStyle(BOLD);
  text(displayGenre.toUpperCase(), -sleeveSize/2 + 28, -sleeveSize/2 + 24);

  pop();
  pop();


  // --- 2. COLONNA DESTRA: INFORMAZIONI CENTRATE ---
  btnX = halfWidth + 60;
  let maxTextWidth = halfWidth - 120;

  if (selectedAlbum) {
    let title = selectedAlbum.getString("release_name");
    let artist = selectedAlbum.getString("artist_name");
    let date = selectedAlbum.getString("release_date");
    let year = date ? date.substring(0, 4) : "-";
    let rating = selectedAlbum.getNum("avg_rating");
    let votes = selectedAlbum.getNum("rating_count");
    let primaryGenres = selectedAlbum.getString("primary_genres");
    let generalGenre = getSimpleGenre(primaryGenres);

    textSize(42);
    let titleLines = ceil(textWidth(title) / maxTextWidth);
    let titleBlockH = titleLines * 48;

    let totalBlockHeight = btnH + 15 + titleBlockH + 20 + 26 + 30 + 15 + 40 + 25 + 60;
    let startY = centerY - (totalBlockHeight / 2);

    let currentY = startY;
    btnY = currentY; // Salviamo la posizione esatta del bottone per il click

    // Tasto "Torna alla Timeline"
    fill(255, 255, 255, 35);
    noStroke();
    rect(btnX, btnY, btnW, btnH, 18);
    fill(255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text("← Torna alla Timeline", btnX + btnW / 2, btnY + btnH / 2);

    // Titolo album
    currentY += 55;
    fill(255);
    textSize(42);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(title, btnX, currentY, maxTextWidth);

    currentY += titleBlockH + 10;

    // Artista
    fill(170);
    textSize(22);
    textStyle(NORMAL);
    text(artist, btnX, currentY);

    currentY += 45;

    // Separatore
    stroke(45);
    strokeWeight(1.5);
    line(btnX, currentY, width - 80, currentY);
    
    currentY += 20;
    let colWidth = maxTextWidth / 2;

    // Riga 1: Anno & Voto Medio
    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("ANNO DI USCITA", btnX, currentY);
    text("VOTO MEDIO", btnX + colWidth, currentY);

    currentY += 18;
    fill(240);
    textSize(20);
    textStyle(BOLD);
    text(year, btnX, currentY);
    text(rating + " / 5.0", btnX + colWidth, currentY);

    // Riga 2: Popolarità & Genere
    currentY += 45;
    fill(120);
    textSize(11);
    textStyle(NORMAL);
    text("POPOLARITÀ (VOTI)", btnX, currentY);
    text("GENERE", btnX + colWidth, currentY);

    currentY += 18;
    fill(240);
    textSize(20);
    textStyle(BOLD);
    text(Number(votes).toLocaleString(), btnX, currentY);
    text(generalGenre, btnX + colWidth, currentY);

  } else {
    fill(255);
    textSize(18);
    textAlign(LEFT, TOP);
    text("Caricamento informazioni album...", btnX, centerY);
  }
}

// Controllo preciso del click sul bottone basato sulle coordinate salvate
function mousePressed() {
  if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
    window.location.href = "index.html";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}