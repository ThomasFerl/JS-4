export class TFChart extends TFPanel
{
  constructor(parent, left, top, width, height, params)
  {
    if (!params) this.params = {};
    else this.params = params;

    params.chartType               = params.chartType               || 'SPLINE_NO_POINTS';
    params.caption                 = params.caption                 || '';
    params.chartData               = params.chartData               || [];  
    params.tension                 = params.tension                 || 0.4;
    params.radius                  = params.radius                  || 4;
    params.showLines               = params.showLines               || true;
    params.charBackgroundColor     = params.charBackgroundColor     || 'rgba( 77,  77,  77, 0.35)' ;
    params.gridAreaBackgroundColor = params.gridAreaBackgroundColor || 'rgb(237,237,237)';
    params.chartPointColor         = params.chartPointColor         || 'rgba(240, 240, 240, 0.4)' ;
    params.chartBorderColor        = params.chartBorderColor        || 'rgba(0  ,   0, 100, 0.21)' ;
    params.chartBorderWidth        = params.chartBorderWidth        || 2;
    params.chartSelectedColor      = params.chartSelectedColor      || 'rgba(0  , 100, 200, 0.35)' ;

    super(parent, left, top, width, height, params);
  }


  




  render()
  {
    super.render();

    this.padding      = 0;
    this.chartOptions = {};
    this.chartParams  = {}

    this.  __prepare();
  }

    
  
}

