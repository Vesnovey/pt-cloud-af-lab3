const cards = [...document.querySelectorAll('.carousel .card')];
const indicator = document.querySelector('#card-index');
let selected = 0;

function showCard(offset) {
  cards[selected].hidden = true;
  selected = (selected + offset + cards.length) % cards.length;
  cards[selected].hidden = false;
  indicator.textContent = (selected + 1) + ' из ' + cards.length;
}

document.querySelector('#prev').addEventListener('click', () => showCard(-1));
document.querySelector('#next').addEventListener('click', () => showCard(1));
