// Re-export small JSON indices here later.
// export { default as calendar } from "./calendar.json" assert { type: "json" };

const rank = new Map([
  ["t", "Triduum"],
  ["s", "Solemnity"],
  ["f", "Feast"],
  ["m", "Memorial"],
  ["o", "Optional Memorial"],
]);

const seasons = new Map([
  ["ad", "Advent"],
  ["ct", "Christmastide"],
  ["lt", "Lent"],
  ["ot", "Ordinary Time"],
  ["ot2", "Ordinary Time"],
  ["pt", "Paschaltide"],
  ["hw", "Holy Week"],
  ["tr", "Tridumm"],
]);
const office = new Map([
  ["an", "Antiphona"],
  ["al", "Allelulia"],
  ["ca", "Canticum"],
  ["co", "Communio"],
  ["gr", "Graduale"],
  ["hy", "Hymnus"],
  ["in", "Introitus"],
  ["ky", "Kyriale"],
  ["of", "Offertorium"],
  ["ps", "Psalmus"],
  ["re", "Responsorium"],
  ["rb", "Responsorium breve"],
  ["se", "Sequentia"],
  ["tr", "Tractus"],
  ["tp", "Tropa"],
  ["or", "Toni Communes"],
]);

const ordinary = new Map([
  ["ke", "Kyrie eleison"],
  ["gl", "Gloria"],
  ["cr", "Credo"],
  ["sa", "Sanctus"],
  ["ad", "Agnus Dei"],
  ["be", "Benedicamus"],
  ["it", "Ite missa est"],
]);
