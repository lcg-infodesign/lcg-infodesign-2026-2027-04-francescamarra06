let rawData;
let filteredData = []; 
let minYear, maxYear;

// Soglia di popolarità (regolabile)
let minRatingCountThreshold = 15000; 

let backgroundColor = '#121212';
let axisColor = '#333333';
let margin = 80;
let genreColors = {};
let defaultColor = '#999999';

// Variabili per l'interazione col mouse
let hoveredLabel = "";
let hoveredId = null;
let hovered = false;
let closestRow = null;

// Funzione per semplificare/raggruppare i generi musicali in macro-categorie
function getSimpleGenre(rawGenre) {
  let g = rawGenre.toLowerCase();
  
  if (g.includes('hip hop') || g.includes('rap') || g.includes('trap')) return 'Hip Hop / Rap';
  if (g.includes('electronic') || g.includes('ambient') || g.includes('techno') || g.includes('house') || g.includes('idm') || g.includes('synth') || g.includes('edm')) return 'Electronic';
  if (g.includes('metal') || g.includes('hardcore') || g.includes('punk')) return 'Metal / Punk';
  if (g.includes('jazz') || g.includes('blues') || g.includes('soul') || g.includes('funk') || g.includes('r&b')) return 'Jazz / Soul / R&B';
  if (g.includes('folk') || g.includes('country') || g.includes('singer-songwriter') || g.includes('acoustic')) return 'Folk / Country';
  if (g.includes('pop')) return 'Pop';
  if (g.includes('rock') || g.includes('indie rock') || g.includes('alternative') || g.includes('shoegaze') || g.includes('grunge') || g.includes('progressive')) return 'Rock / Alternative';
  
  // Genere generico se non rientra nelle categorie sopra
  let firstPrimary = rawGenre.split(",")[0].trim();
  return firstPrimary;
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  // Carica il dataset CSV
  rawData = await loadTable("rym_clean1.csv", ",", "header");

  minYear = 3000;
  maxYear = 0;

  let colorPalette = [
    '#66A9ED', '#E06C75', '#98C379', '#E5C07B', 
    '#C678DD', '#56B6C2', '#D19A66', '#BE5046', '#E0A96D', '#9381FF'
  ];
  let colorIndex = 0;

  // Filtraggio per popolarità
  for (let rowNumber = 0; rowNumber < rawData.getRowCount(); rowNumber++) {
    let ratingCount = rawData.getNum(rowNumber, "rating_count");
    let dateStr = rawData.getString(rowNumber, "release_date");
    let year = int(dateStr.substring(0, 4));

    if (ratingCount >= minRatingCountThreshold) {
      filteredData.push(rawData.getRow(rowNumber));

      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;

      let rawGenre = rawData.getString(rowNumber, "primary_genres");
      let simpleGenre = getSimpleGenre(rawGenre);

      if (!genreColors[simpleGenre]) {
        genreColors[simpleGenre] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
    }
  }
}

function draw() {
  background(backgroundColor);

  // Titolo
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("ARCHIVIO STORICO DEI VINILI & CD", margin, 25);

  // Asse Y (Freccia Popolarità)
  let arrowX = margin - 35;
  let arrowStartY = height - margin - 20;
  let arrowEndY = margin + 60;

  stroke(100);
  strokeWeight(1.5);
  line(arrowX, arrowStartY, arrowX, arrowEndY);
  line(arrowX, arrowEndY, arrowX - 4, arrowEndY + 8);
  line(arrowX, arrowEndY, arrowX + 4, arrowEndY + 8);
  push();
  noStroke();
  fill(160);
  textSize(11);
  textAlign(CENTER, CENTER);
  translate(arrowX - 12, (arrowStartY + arrowEndY) / 2);
  rotate(-HALF_PI);
  text("MAGGIORE POPOLARITÀ", 0, 0);
  pop();

  // Anni
  stroke(axisColor);
  strokeWeight(1);
  
  let startDecade = ceil(minYear / 10) * 10;
  for (let y = startDecade; y <= maxYear; y += 10) {
    let xCoord = map(y, minYear - 0.5, maxYear + 0.5, margin, width - margin);
    
    stroke(35);
    line(xCoord, margin + 40, xCoord, height - margin);
    
    noStroke();
    fill(140);
    textSize(11);
    textAlign(CENTER, TOP);
    text(y, xCoord, height - margin + 10);
  }

  // Conteggi annuali
  let yearCounts = {};
  let yearCurrentIndex = {};

  for (let i = 0; i < filteredData.length; i++) {
    let yr = int(filteredData[i].getString("release_date").substring(0, 4));
    yearCounts[yr] = (yearCounts[yr] || 0) + 1;
  }

  let minDistance = 99999;
  closestRow = null;
  
  let activeX = 0, activeY = 0, activeDiameter = 20;
  let activeColor = '', activeGenre = '', activeRating = 0, activeYear = 0, activeArtist = '', activeAlbum = '', activeId = '', activeVotes = 0;

  // Posizione dei dischi
  for (let i = 0; i < filteredData.length; i++) {
    let row = filteredData[i];
    let dateStr = row.getString("release_date");
    let year = int(dateStr.substring(0, 4));
    let rating = row.getNum("avg_rating");
    let ratingCount = row.getNum("rating_count");
    
    let albumName = row.getString("release_name");
    let artistName = row.getString("artist_name");
    let rawGenre = row.getString("primary_genres");
    let simpleGenre = getSimpleGenre(rawGenre);
    let positionId = row.getString("position");

    if (yearCurrentIndex[year] === undefined) {
      yearCurrentIndex[year] = 0;
    } else {
      yearCurrentIndex[year]++;
    }
    let indexInYear = yearCurrentIndex[year];

    let baseX = map(year, minYear - 0.5, maxYear + 0.5, margin, width - margin);

    let itemsPerColumn = 8; 
    let subColWidth = 24; 
    let subColIndex = floor(indexInYear / itemsPerColumn);
    let rowInSubCol = indexInYear % itemsPerColumn;

    let x = baseX + (subColIndex * subColWidth) - 10;
    
    let topBoundary = margin + 50;
    let availableHeight = (height - margin) - topBoundary;
    let spacingY = availableHeight / itemsPerColumn;
    let diameter = constrain(spacingY - 6, 16, 28);
    
    let y = (height - margin - 30) - (rowInSubCol * spacingY);

    let d = dist(mouseX, mouseY, x, y);
    let hitRadius = max(diameter / 2, 14);

    if (d < minDistance) {
      minDistance = d;
      if (d < hitRadius) {
        closestRow = i;
        activeX = x;
        activeY = y;
        activeDiameter = diameter;
        activeColor = genreColors[simpleGenre] || defaultColor;
        activeGenre = simpleGenre;
        activeRating = rating;
        activeYear = year;
        activeArtist = artistName;
        activeAlbum = albumName;
        activeId = positionId;
        activeVotes = ratingCount;
      }
    }
  }

  yearCurrentIndex = {};

  // Dischi di sfondo
  for (let i = 0; i < filteredData.length; i++) {
    if (i === closestRow) continue;

    let row = filteredData[i];
    let year = int(row.getString("release_date").substring(0, 4));
    let rawGenre = row.getString("primary_genres");
    let simpleGenre = getSimpleGenre(rawGenre);

    if (yearCurrentIndex[year] === undefined) {
      yearCurrentIndex[year] = 0;
    } else {
      yearCurrentIndex[year]++;
    }
    let indexInYear = yearCurrentIndex[year];

    let baseX = map(year, minYear - 0.5, maxYear + 0.5, margin, width - margin);
    let itemsPerColumn = 8;
    let subColWidth = 24;
    let subColIndex = floor(indexInYear / itemsPerColumn);
    let rowInSubCol = indexInYear % itemsPerColumn;

    let x = baseX + (subColIndex * subColWidth) - 10;
    let topBoundary = margin + 50;
    let availableHeight = (height - margin) - topBoundary;
    let spacingY = availableHeight / itemsPerColumn;
    let diameter = constrain(spacingY - 6, 16, 28);
    let y = (height - margin - 30) - (rowInSubCol * spacingY);

    let col = genreColors[simpleGenre] || defaultColor;
    drawCD(x, y, diameter, col, 210);
  }

  // Hover del disco
  if (closestRow !== null) {
    hovered = true;
    hoveredId = activeId;
    hoveredLabel = activeArtist + " - " + activeAlbum + " (" + activeYear + ") [" + activeGenre + "] - Voto: " + activeRating + " (" + activeVotes.toLocaleString() + " voti)";

    stroke(255);
    strokeWeight(2);
    drawCD(activeX, activeY, activeDiameter + 10, activeColor, 255);

    cursor(HAND);
    fill(255);
    noStroke();
    textSize(13);
    textAlign(LEFT, BOTTOM);
    text(hoveredLabel, mouseX + 14, mouseY - 10);
  } else {
    hovered = false;
    cursor(ARROW);
  }
}

// Funzione di rendering del CD
function drawCD(x, y, d, col, alphaVal) {
  let c = color(col);
  c.setAlpha(alphaVal);
  
  fill(c);
  stroke(30, alphaVal);
  strokeWeight(1);
  ellipse(x, y, d, d);

  noFill();
  stroke(255, alphaVal * 0.5);
  strokeWeight(0.5);
  ellipse(x, y, d * 0.6, d * 0.6);

  fill(255, alphaVal * 0.8);
  noStroke();
  ellipse(x, y, d * 0.3, d * 0.3);

  fill(backgroundColor);
  ellipse(x, y, d * 0.12, d * 0.12);
}

function mousePressed() {
  if (hovered && hoveredId !== null) {
    let newURL = "detail.html?position=" + hoveredId;
    window.location.href = newURL;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}