const offerLink = document.querySelector('#offerLink');
if (offerLink) {
  const token = new URLSearchParams(window.location.search).get('_token') || '';
  offerLink.href = `https://clickdist.dev30.leaddist.team/QUBuhDAi?lp=1&token=${encodeURIComponent(token)}`;
}

let seats = 18;
const spots = document.querySelector('#spots');

document.querySelector('#seatButton').addEventListener('click', () => {
  seats = Math.max(0, seats - 1);
  spots.textContent = `${seats} seats left`;
});
