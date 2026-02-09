import Notiflix from 'notiflix';

let configured = false;

export function ensureNotiflixConfigured() {
  if (configured) return;
  Notiflix.Confirm.init({
    titleColor: '#13201f',
    messageColor: '#4c5a57',
    okButtonBackground: '#12806e',
    okButtonColor: '#ffffff',
    cancelButtonBackground: '#efe8df',
    cancelButtonColor: '#4c5a57',
    borderRadius: '18px',
    zindex: 99999
  });
  Notiflix.Loading.init({
    svgColor: '#ffffff',
    messageColor: '#ffffff',
    messageFontSize: '19px',
    backgroundColor: 'rgba(11, 16, 20, 0.75)',
    svgSize: '80px',
    clickToClose: false,
    zindex: 99998
  });
  // Report 기본값
  Notiflix.Report.init({
    titleColor: '#13201f',
    messageColor: '#4c5a57',
    success: {
      svgColor: '#16a34a',
      buttonBackground: '#12806e'
    },
    failure: {
      svgColor: '#ef4444',
      buttonBackground: '#12806e'
    },
    warning: {
      svgColor: '#f59e0b',
      buttonBackground: '#12806e'
    }
  } as any);
  configured = true;
}

export { Notiflix };
