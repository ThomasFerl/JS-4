export const videoExtensions = [
    'mp4', 'm4v', 'mov', 'avi', 'wmv', 'flv',
    'f4v', 'mkv', 'webm', 'ts', 'mpeg', 'mpg',
    '3gp', 'ogv'
  ];
  
  export const imageExtensions = [
    'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg'
  ];
  

  export function isValidVideoExtension( fileName )
  {
    var ext = fileName.split('.').pop().toLowerCase();
    return videoExtensions.includes(ext);
  }

  export function isValidImageExtension( fileName )
  {
        var ext = fileName.split('.').pop().toLowerCase();
        return imageExtensions.includes(ext);
  }   
  