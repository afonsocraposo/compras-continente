const ID_TOTAL = ["totalA", "totalG", "totalL"];
const ID_DIVIDA = ["dividaA", "dividaG", "dividaL"];

let valorPago, pagoPor, pagoPorIndex, valorSacos, pagoCartao = 0, total=0, produtos;

function parse() {

  valorSacos = parseFloat(document.getElementById("valor-sacos").value);
  valorPago = parseFloat(document.getElementById("valor-pago").value);
  if(isNaN(valorPago) || valorPago == 0){
    return;
  }

  pagoPor = document.getElementById("pago-por").value;
  pagoPorIndex = 0;
  switch(pagoPor) {
    case "G":
      pagoPorIndex = 1;
      break;
    case "L":
      pagoPorIndex = 2;
      break;
    default:
      break;
  }

  const compras = document.getElementById("compras-raw");
  const text = compras.value;

  const produtosText = text.split("\n-\n");
  produtos = produtosText.map((text)=>Produto.fromText(text, pagoPorIndex));

  const quantidades = [0, 0, 0];
  quantidades[pagoPorIndex] = 1;
  produtos.push(new Produto("Sacos plástico", "-", valorSacos, 0, quantidades))

  createTable();
}

class Produto {

  constructor(name, amount, value, sale, quantidades){
    this.name = name;
    this.amount = amount;
    this.value = value;
    this.sale = sale;
    this.quantidades = quantidades;
    this.entregue = true;
  }

  static fromText(text, defaultQuantidade=undefined) {
    let name, amount, value, sale, quantidades;

    text = text.replaceAll("-","").trim();
    const parts = text.split("\n").reverse();
    let offset = 0;
    if(parts[1].startsWith("€")){
      sale = Produto.parseValue(parts[0]);
      offset = 1;
    }else{
      sale = 0;
    }
    value = Produto.parseValue(parts[0+offset]);
    amount = parts[1+offset];
    let description = parts.slice(2+offset).slice(0,2);
    name = description.reverse().join(" ");
    quantidades = [0, 0, 0]
    if(defaultQuantidade!==undefined){
      quantidades[defaultQuantidade]=1;
    }

    return new Produto(name, amount, value, sale, quantidades)
  }

  static parseValue(text) {
    return parseFloat(text.slice(1).replaceAll(",","."))
  }

  price() {
    if(!this.entregue){
      return 0;
    }
    return this.value;
  }
}

function createTable() {
  const callback = function(){
    updateValues(produtos);
  }
  const placeholder = document.getElementById('tabela');
  placeholder.innerHTML = "";
  const tbl = document.createElement('table');
  tbl.style.border = '1px solid black';
  const header = tbl.insertRow();
  addCell(header, "Produto", undefined, "name");
  addCell(header, "Quantidade");
  addCell(header, "Rutura");
  addCell(header, "Preço");
  addCell(header, "A");
  addCell(header, "G");
  addCell(header, "L");
  produtos.forEach((produto)=>{
    const tr = tbl.insertRow();
    addCell(tr, produto.name, undefined, "name");
    addCell(tr, produto.amount);
    addEntregue(tr, produto);
    addPrice(tr, produto);
    for(let i = 0; i<produto.quantidades.length; i++){
      addInput(tr, produto, i, callback);
    }
  });

  const totalPrice = tbl.insertRow();
  addCell(totalPrice, "");
  addCell(totalPrice, "");
  addCell(totalPrice, "TOTAL");

  total = totalCusto(produtos)
  pagoCartao = total - valorPago;

  addCell(totalPrice, total.toFixed(2)+"€", undefined, "price");
  addCell(totalPrice, calcularTotal(produtos, 0).toFixed(2)+"€", ID_TOTAL[0], "price");
  addCell(totalPrice, calcularTotal(produtos, 1).toFixed(2)+"€", ID_TOTAL[1], "price");
  addCell(totalPrice, calcularTotal(produtos, 2).toFixed(2)+"€", ID_TOTAL[2], "price");

  const cartaoPrice = tbl.insertRow();
  addCell(cartaoPrice, "");
  addCell(cartaoPrice, "");
  addCell(cartaoPrice, "Cartão");
  addCell(cartaoPrice, pagoCartao.toFixed(2)+"€");
  addCell(cartaoPrice, "");
  addCell(cartaoPrice, "");
  addCell(cartaoPrice, "");

  const dividas = tbl.insertRow();
  addCell(dividas, "");
  addCell(dividas, "");
  addCell(dividas, "");
  addCell(dividas, "Dívidas", undefined, );
  addCell(dividas, calcularDivida(produtos, 0).toFixed(2), ID_DIVIDA[0], "price");
  addCell(dividas, calcularDivida(produtos, 1).toFixed(2), ID_DIVIDA[1], "price");
  addCell(dividas, calcularDivida(produtos, 2).toFixed(2), ID_DIVIDA[2], "price");


  placeholder.appendChild(tbl);
}

function addCell(tr, value, id=undefined, className=undefined) {
  const tc = tr.insertCell()
  if(id!==undefined){
    tc.id = id;
  }
  if(className!==undefined){
    tc.className = className;
  }
  tc.appendChild(document.createTextNode(value));
}

function addInput(tr, produto, i, callback) {
  const input = document.createElement("input");
  input.type = "number";
  input.value = produto.quantidades[i];
  input.min = 0;
  input.max = 99;
  input.addEventListener("input", (event)=>{
    produto.quantidades[i] = parseInt(event.target.value);
    callback()
  })
  tr.insertCell().appendChild(input);
}

function addPrice(tr, produto) {
  const input = document.createElement("input");
  input.type = "number";
  input.max = 99.99;
  input.min = 0;
  input.value = produto.price();
  input.addEventListener("input", (event)=>{
    produto.value = parseFloat(event.target.value);
  })
  input.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      createTable();
    }
});
  tr.insertCell().appendChild(input);
}

function addEntregue(tr, produto) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !produto.entregue;
  input.addEventListener("input", (event)=>{
    produto.entregue = !event.target.checked;
    createTable()
  })
  tr.insertCell().appendChild(input);
}

function updateValues(produtos){
  const totais = []
  for(let i = 0; i<3; i++){
    const total = calcularTotal(produtos, i);
    totais.push(total);
    const elTotal = document.getElementById(ID_TOTAL[i]) 
    elTotal.innerText = total.toFixed(2) + "€";
  }

  const dividas = [];
  for(let i = 0; i<totais.length; i++){
    if(i!==pagoPorIndex){
      let divida = totais[i];
      divida -= pagoCartao * divida / total;
      dividas.push(divida);

      const elDivida = document.getElementById(ID_DIVIDA[i]) 
      elDivida.innerText = "-"+divida.toFixed(2) + "€";
    }
  }

  const divida = dividas.reduce((a, b) => a + b, 0);
  const elDivida = document.getElementById(ID_DIVIDA[pagoPorIndex]) 
  elDivida.innerText = "+"+divida.toFixed(2) + "€";

}

function totalCusto(produtos){
  let total=0;
  produtos.forEach((produto) => {
    total += produto.price();
  });
  return total;
}

function calcularTotal(produtos, index) {
  let total = 0;
  produtos.forEach((produto) => {
    if(produto.quantidades[index]>0){
      const N = produto.quantidades.reduce((a, b) => a + b, 0)
      total += produto.price() * produto.quantidades[index] / N;
    }
  })
  return total;
}

function calcularDivida(produtos, index) {
  if(index == pagoPorIndex){
    return 0;
  }
  let divida = 0;
  produtos.forEach((produto) => {
    const N = produto.quantidades.reduce((a, b) => a + b, 0)
    if(produto.quantidades[index]>0){
      divida += produto.price() * (1-produto.quantidades[index] / N);
    }
  })
  return divida;
}
