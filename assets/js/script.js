var modalEl = document.getElementById("add-entry-modal");
var modal = new bootstrap.Modal(modalEl, { keyboard: false });
var firstInput = document.querySelector("#add-entry-modal input");

modalEl.addEventListener("shown.bs.modal", function () {
  firstInput.focus();
});

modalEl.addEventListener("hidden.bs.modal", () => {
  if (modalEl.querySelector(".alert-danger")) {
    modalEl.querySelector(".alert-danger").remove();
  }
});

var DateTime = luxon.DateTime;

var cardCounter = 0;

var currencyFormatter = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

var cards = [];

// Add card to content
var addCardHandler = function (event) {
  var newCardNameEl = document.querySelector("#newCardName");
  var newAmountDueEl = document.querySelector("#newAmountDue");
  var newExpDateEl = document.querySelector("#newExpDate");

  var newCardName = newCardNameEl.value;
  var newAmountDue = newAmountDueEl.value;
  var newExpDate = newExpDateEl.value;

  if (newCardName !== "" && newAmountDue > 0 && newExpDate) {
    if (modalEl.querySelector(".alert-danger")) {
      modalEl.querySelector(".alert-danger").remove();
    }
    // clear the modal form values
    newCardNameEl.value = "";
    newAmountDueEl.value = "";
    newExpDateEl.value = "";

    // Add the card
    addCard(newCardName, newAmountDue, newExpDate);

    modal.toggle();
  } else {
    // display a danger alert within the modal
    if (modalEl.querySelector(".alert-danger")) {
      return false;
    }
    var dangerAlert = document.createElement("div");
    dangerAlert.className = "alert alert-danger";
    dangerAlert.innerHTML = "Invalid input!";
    modalEl.querySelector(".modal-footer").prepend(dangerAlert);
    return false;
  }
};

var addCard = function (cardName, amountDue, expiration) {
  var monthsToExp = calcMonthsToExpire(expiration);
  var monthlyPayment = calcMonthlyPayment(amountDue, expiration);
  expiration = convertTextDateToDateTime(expiration).toLocaleString();

  var cardCol = document.createElement("div");
  cardCol.id = cardCounter;
  cardCol.className = "col-10 col-sm-6";
  cardCol.innerHTML = `<div class="card">
  <div class="card-body">
      <div class="card-title">
      <h3 class="cardName">${cardName}</h3>
      </div>
      <div class="card-text">
          <p>Amount Due: <span class="amountDue">${currencyFormatter.format(
            amountDue
          )}</span></p>
          <p>
              0% Exp:
              <span class="expiration">${expiration}</span> (<span
              class="monthsToExpire"
              >${monthsToExp}</span
              >
              Months)
          </p>
          <p>
              Monthly Payments: <span class="monthlyPayment">${currencyFormatter.format(
                monthlyPayment
              )}</span>
          </p>
      </div>
  </div>
  <div class="card-footer d-flex justify-content-around">
      <span class="material-icons-outlined btn save-btn" data-cardid="${cardCounter}" hidden> save </span>
      <span class="material-icons-outlined btn edit-btn" data-cardid="${cardCounter}"> edit </span>
      <span class="material-icons-outlined btn delete-btn" data-cardid="${cardCounter}"> delete </span>
  </div>
</div>`;
  document.querySelector("#content").appendChild(cardCol);

  // add cardObj to cards
  var cardObj = {
    id: cardCounter,
    cardName: cardName,
    amountDue: amountDue,
    expiration: expiration,
  };
  cards.push(cardObj);

  // Add save, edit, and delete buttons
  document
    .getElementById(parseInt(cardCounter))
    .querySelector(".edit-btn")
    .addEventListener("click", editCard);

  document
    .getElementById(parseInt(cardCounter))
    .querySelector(".delete-btn")
    .addEventListener("click", deleteCard);

  document
    .getElementById(parseInt(cardCounter))
    .querySelector(".save-btn")
    .addEventListener("click", saveCardHandler);

  cardCounter++;
  calcTotalMonthlyPayment();
  saveData();
};

// TODO: populate date input
var editCard = function (event) {
  var cardId = event.target.dataset.cardid;

  var card = document.getElementById(cardId);

  event.target.hidden = "true";

  var saveBtn = card.querySelector(".save-btn");
  saveBtn.hidden = false;

  var cardNameEl = card.querySelector(".cardName");
  var amountDueEl = card.querySelector(".amountDue");
  var expirationEl = card.querySelector(".expiration");

  var cardName = cardNameEl.innerHTML;
  var amountDue = amountDueEl.innerHTML.replace("$", "").replace(",", "");
  var expiration = expirationEl.innerHTML;

  inputCardNameEl = document.createElement("input");
  inputCardNameEl.className = "cardNameInput";
  inputCardNameEl.value = cardName;
  cardNameEl.parentNode.replaceChild(inputCardNameEl, cardNameEl);

  inputCardAmountDueEl = document.createElement("input");
  inputCardAmountDueEl.type = "number";
  inputCardAmountDueEl.className = "amountDueInput";
  console.log(amountDue);
  inputCardAmountDueEl.value = amountDue;
  amountDueEl.parentNode.replaceChild(inputCardAmountDueEl, amountDueEl);

  inputCardExpirationEl = document.createElement("input");
  inputCardExpirationEl.type = "date";
  inputCardExpirationEl.className = "expirationInput";
  inputCardExpirationEl.value =
    convertTextDateToDateTime(expiration).toISODate();
  expirationEl.parentNode.replaceChild(inputCardExpirationEl, expirationEl);

  card.querySelector(".monthsToExpire").hidden = true;
  card.querySelector(".monthlyPayment").hidden = true;
};

var saveCardHandler = function (event) {
  var cardId = event.target.dataset.cardid;
  card = document.getElementById(cardId);
  event.target.hidden = true;
  card.querySelector(".edit-btn").hidden = false;

  var cardNameInputEl = card.querySelector(".cardNameInput");
  var amountDueInputEl = card.querySelector(".amountDueInput");
  var expirationInputEl = card.querySelector(".expirationInput");

  cardNameInput = cardNameInputEl.value;
  amountDueInput = amountDueInputEl.value;
  expirationInput = expirationInputEl.value;

  saveCard(cardId, cardNameInput, amountDueInput, expirationInput);
};

// TODO: data validation on inputs
var saveCard = function (cardId, cardName, amountDue, expiration) {
  var card = document.getElementById(cardId);

  var cardNameInputEl = card.querySelector(".cardNameInput");
  var amountDueInputEl = card.querySelector(".amountDueInput");
  var expirationInputEl = card.querySelector(".expirationInput");

  cardName = cardNameInputEl.value;
  amountDue = amountDueInputEl.value;
  expiration = expirationInputEl.value;
  console.log(expiration);

  var cardNameEl = document.createElement("h3");
  cardNameEl.className = "cardName";
  cardNameEl.innerHTML = cardName;

  var amountDueEl = document.createElement("span");
  amountDueEl.className = "amountDue";
  amountDueEl.innerHTML = currencyFormatter.format(amountDue);

  var expirationEl = document.createElement("span");
  expirationEl.className = "expiration";
  expirationEl.innerHTML =
    convertTextDateToDateTime(expiration).toLocaleString();

  var monthsToExpireEl = card.querySelector(".monthsToExpire");
  monthsToExpireEl.innerHTML = calcMonthsToExpire(expiration);

  var monthlyPaymentEl = card.querySelector(".monthlyPayment");
  monthlyPaymentEl.innerHTML = currencyFormatter.format(
    calcMonthlyPayment(parseInt(amountDue), expiration)
  );

  cardNameInputEl.parentNode.replaceChild(cardNameEl, cardNameInputEl);
  amountDueInputEl.parentNode.replaceChild(amountDueEl, amountDueInputEl);
  expirationInputEl.parentNode.replaceChild(expirationEl, expirationInputEl);
  monthsToExpireEl.hidden = false;
  monthlyPaymentEl.hidden = false;

  cards.forEach((c) => {
    if (c.id === parseInt(cardId)) {
      console.log(c);
      c.cardName = cardName;
      c.amountDue = amountDue;
      c.expiration = convertTextDateToDateTime(expiration).toLocaleString();
    }
  });

  saveData();

  calcTotalMonthlyPayment();
};

// TODO: add a confirmation before deletion
var deleteCard = function (event) {
  var cardId = event.target.dataset.cardid;
  document.getElementById(cardId).remove();
  var cardsKept = [];

  cards.forEach((c) => {
    if (c.id !== parseInt(cardId)) {
      console.log(cardId, c.id);
      cardsKept.push(c);
    }
  });

  cards = cardsKept;
  saveData();

  calcTotalMonthlyPayment();
};

var saveData = () => {
  localStorage.setItem("cards", JSON.stringify(cards));
};

var loadData = () => {
  var savedData = JSON.parse(localStorage.getItem("cards"));
  console.log(savedData);
  savedData.forEach((c) => {
    console.log(c.expiration);
    addCard(c.cardName, c.amountDue, c.expiration);
  });
  calcTotalMonthlyPayment();
};

// Utility Functions
// =================
var convertTextDateToDateTime = function (textDate) {
  if (textDate.includes("-")) {
    textDate = textDate.split("-");
    return DateTime.local(
      parseInt(textDate[0]),
      parseInt(textDate[1]),
      parseInt(textDate[2])
    );
  } else if (textDate.includes("/")) {
    textDate = textDate.split("/");
    return DateTime.local(
      parseInt(textDate[2]),
      parseInt(textDate[0]),
      parseInt(textDate[1])
    );
  } else {
    throw Error("Invalid text format.");
  }
};

var calcMonthsToExpire = function (expiration) {
  return Math.round(
    convertTextDateToDateTime(expiration).diffNow().as("month")
  );
};

var calcMonthlyPayment = function (amountDue, expiration) {
  var monthsToExpire = calcMonthsToExpire(expiration);
  return amountDue / monthsToExpire;
};

var calcTotalMonthlyPayment = function () {
  // get all monthly payments and sum them
  var contentChildren = document.getElementById("content").children;
  var totalMonthlyPayment = 0;
  for (var i = 0; i < contentChildren.length; i++) {
    totalMonthlyPayment += parseFloat(
      contentChildren[i]
        .querySelector(".monthlyPayment")
        .innerHTML.replace("$", "")
        .replace(",", "")
    );
  }
  // update "Total due monthly"
  var totalMonthlyEl = document.getElementById("totalMonthly");
  totalMonthlyEl.innerHTML = currencyFormatter.format(totalMonthlyPayment);
};
// END Utility Functions

document
  .querySelector("#submitEntry")
  .addEventListener("click", addCardHandler);

loadData();
