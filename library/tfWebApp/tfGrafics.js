
// Kreis zeichnen als Funktion exportieren
export function drawCircle(ctx, x, y, radius , params ) 
{
    if(!params) params = {};
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = params.backgroundColor || 'blue';
    ctx.fill();
    ctx.closePath();
}   

