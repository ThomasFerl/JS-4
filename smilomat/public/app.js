let score       = 0, 
     totalSmile = 0, 
     smileCount = 0, 
     timeLeft   = 60, 
     timer      = null;
     playerName = '';

if (!playerName) playerName = "Unbekannt";

const ctx        = document.getElementById('smileChart').getContext('2d');
const smileData  = { labels: [], datasets: [{ label: 'Smile-Intensität', data: [], borderColor: 'lime', fill: false }] };
const smileChart = new Chart(ctx, { type: 'bar', data: smileData, options: { animation: true } });

function updateChart(smileProb) 
{
  smileData.labels.push('');
  smileData.datasets[0].data.push(smileProb);
  smileChart.update();
}

async function start() 
{
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');

  const video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: {} }).then(stream => video.srcObject = stream);

  video.addEventListener('play', () => 
  {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    // Countdown starten
    timer = setInterval(async () => 
    {
       timeLeft--;
       document.getElementById('countdown').innerText = 'noch ' + timeLeft + ' Sekunden';
       if (timeLeft <= 0) { clearInterval(timer); endGame(); }

       const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
       const resized    = faceapi.resizeResults(detections, displaySize);
       canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
     
        //faceapi.draw.drawDetections(canvas, resized);
        //faceapi.draw.drawFaceExpressions(canvas, resized);

      if (detections.length > 0) 
      {
        let   smileProb  =    (detections[0].expressions.happy     *2   )
                            + (detections[0].expressions.neutral   *0.25) 
                            + (detections[0].expressions.surprised *0.75)
                         
                            - (detections[0].expressions.sad       *0.5)
                            - (detections[0].expressions.fearful   *1.5) 
                            - (detections[0].expressions.disgusted *2.5)
                            - (detections[0].expressions.angry     *2.5)
        
        //smileProb = smileProb / 5                    

        if(smileProb>1) smileProb = 1;
        console.log(smileProb);

        // console.log(detections[0].expressions);

        totalSmile      += smileProb; 
        smileCount++; 
        updateChart(smileProb);
        
        if (smileProb > 0) 
        {
          score++;
          document.getElementById('highscore').innerText = "Freunlichkeit: " + Math.round((totalSmile/smileCount)*100) + '%';
        }
      }
    }, 1000);
  });
}

function endGame() 
{
  //const avgSmile = (smileCount > 0) ? (totalSmile / smileCount) : 0;
  //alert("Spiel vorbei!\nDurchschnittliche Smile-Intensität: " + avgSmile.toFixed(2) + "\nHighscore: " + score);

  // Bestenliste aktualisieren
  updateLeaderboard(playerName, avgSmile, score);

  // Rückmeldung an Delphi
  if (window.external && window.external.notify) {
    window.external.notify("GameOver:Player=" + playerName + ";AvgSmile=" + avgSmile.toFixed(2) + ";Score=" + score);
  }
}

function updateLeaderboard(name, avgSmile, score) 
{
  return;
  let leaderboard = JSON.parse(localStorage.getItem("smilomatLeaderboard") || "[]");
  leaderboard.push({ name, avgSmile, score });
  leaderboard.sort((a, b) => b.avgSmile - a.avgSmile); // sortiert nach Smile-Intensität
  localStorage.setItem("smilomatLeaderboard", JSON.stringify(leaderboard));

  let html = "<h2>Bestenliste</h2><ol>";
  leaderboard.forEach(entry => {
    html += `<li>${entry.name} – Intensität: ${entry.avgSmile.toFixed(2)}, Score: ${entry.score}</li>`;
  });
  html += "</ol>";
  document.getElementById('leaderboard').innerHTML = html;
}

start();
