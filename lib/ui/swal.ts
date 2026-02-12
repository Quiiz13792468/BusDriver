import Swal, { type SweetAlertIcon } from 'sweetalert2';

type AutoPopupInput = {
  icon: SweetAlertIcon;
  title: string;
  text?: string;
};

export function fireAutoPopup(input: AutoPopupInput) {
  return Swal.fire({
    icon: input.icon,
    title: input.title,
    text: input.text,
    timer: 1200,
    timerProgressBar: true,
    showConfirmButton: false,
    allowOutsideClick: false,
    heightAuto: false
  });
}
