$(document).ready(function () {
  fetchShop();

  $(document).on("click", ".ShopSidebarLink", function () {
    var $this = $(this); 
    var category = $this.data("category").toLowerCase();
    $(".ShopActiveCategory").removeClass("ShopActiveCategory");
    $this.addClass("ShopActiveCategory");
    if (category.length === 0 && $this.data("all")) {
      $(".ShopItem").removeClass("ShopItemHidden").show();
    } else {
      $(".ShopItem").addClass("ShopItemHidden").hide();
      $(".ShopItem[data-category='" + category + "']").removeClass("ShopItemHidden").show();
    }
  });

  setupShopSorting();

  // Not ideal, but this is a way of determining if a user is logged in or not.
  var loggedIn = $(".login_popup").length != 0;
  if (!loggedIn) {
    $("#ShopLoginOverlay").removeClass("hidden");
    $("#ShopLoginOverlayLogin").on("click", function () {
      window.location = "/kkdystrack/php/login_callback.php";
    });
  }

  $("#ShowOnlyItemsICanAffordCheckbox").on("change", function () {
    var rupeesRegexResults = /(?:Rupees: )(\d+)/g.exec($(".login_popup p").html());
    if (rupeesRegexResults != null) {
      $(".ShopItem.ShopItemHidden").css({ position: "absolute", visibility: "hidden", display: "block" });
      var $divs = $(".ShopItem");
      var numRupees = rupeesRegexResults[1]; 
      if ($(this).is(":checked")) {
        for (var i = 0; i < $divs.length; i = i + 1) {
          var $div = $($divs[i]);
          if ($div.data("cost") >= numRupees) {
            $div.addClass("hidden");
          } else {
            $div.removeClass("hidden");
          } 
        }
      } else {
        for (var i = 0; i < $divs.length; i = i + 1) {
          $($divs[i]).removeClass("hidden");
        }
      }
      $(".ShopItem.ShopItemHidden").css({ position: "", visibility: "", display: "none" });
    }
  });

  // $(".ShopItemPurchase").on("click", function (event) {
  //   var $this = $(this);
  //   var itemId = $this.data("itemId");
  //   $.post("/kkdystrack/php/proc_shop_purchase.php", {"item_id" : itemId}, function (data) {
  //     console.log(data);
  //   });
  // });
});

function fetchShop() {
  $.get("/kkdystrack/php/calc_shop.php")
    .done(function (raw) {
      var $shopSidebar = $("#ShopSidebar");
      var $shopItemList = $("#ShopItemList");
      setUpShop(JSON.parse(raw), $shopSidebar, $shopItemList);
    });
}

function setUpShop(raw, $shopSidebar, $shopItemList, callback) {
  var categories = Object.keys(raw);
  var index = 0;
  for (var i = 0; i < categories.length; i = i + 1) {
    var currentCategory = categories[i];
    var sidebarItem = document.createElement("div");
    sidebarItem.setAttribute("class", "ShopSidebarLink");
    sidebarItem.setAttribute("data-category", currentCategory);
    sidebarItem.textContent = currentCategory;
    $shopSidebar.append(sidebarItem);

    var itemList = raw[currentCategory];
    for (var j = 0; j < itemList.length; j = j + 1) {
      // This is a huge mess, so here's the basic structure:
        // itemWrapper
          // infoWrapper
            // itemImage
            // itemName
            // itemDescription
            // itemStock
            // optionsWrapper
              // purchaseWrapper
                // shoppingCart
              // aboutWrapper
                // infoAnchor
                  // infoSymbol
          // itemPrice
            // rupee
            // normalPrice

      var item = itemList[j];
      var itemWrapper = document.createElement("div");
      itemWrapper.setAttribute("class", "ShopItem");
      itemWrapper.setAttribute("data-category", currentCategory.toLowerCase());
      itemWrapper.setAttribute("data-index", index);
      itemWrapper.setAttribute("data-name", item.item_name.toLowerCase());
      itemWrapper.setAttribute("data-cost", item.cost);

        var infoWrapper = document.createElement("div");
        infoWrapper.setAttribute("class", "ShopItemInfo");

          var itemImage = document.createElement("img");
          itemImage.setAttribute("class", "ShopItemImage");
          itemImage.setAttribute("src", item.item_image);

          var itemName = document.createElement("div");
          itemName.setAttribute("class", "ShopItemName");
          itemName.textContent = item.item_name;

          var itemDescription = document.createElement("div");
          itemDescription.setAttribute("class", "ShopItemDescription");
          itemDescription.textContent = item.description;

          var itemStock = document.createElement("div");
          itemStock.setAttribute("class", "ShopItemStock");
          if (item.stock === "0") {
            stockStatus = "Out of Stock"      
            itemStock.textContent = "OUT OF STOCK";
          } else {
            itemStock.textContent = "IN STOCK: " + item.stock;
          }

          var optionsWrapper = document.createElement("div");
          optionsWrapper.setAttribute("class", "ShopItemOptions");

            var purchaseWrapper = document.createElement("div");
            purchaseWrapper.setAttribute("class", "ShopItemPurchase");
            purchaseWrapper.setAttribute("data-item-id", item.item_id);

              var shoppingCart = document.createElement("i");
              var outOfStock = item.stock === "0" ? "ShopOutOfStock" : "";
              shoppingCart.setAttribute("class", "fas fa-shopping-cart ShopIcon ShopCart ShopOutOfStock");
              purchaseWrapper.appendChild(shoppingCart);

            var aboutWrapper = document.createElement("div");
            aboutWrapper.setAttribute("class", "ShopItemAbout");

              var infoAnchor = document.createElement("a");
              if (item.info) {
                infoAnchor.setAttribute("href", item.info);
                infoAnchor.setAttribute("target", "_blank");
              }

                var infoSymbol = document.createElement("i");
                infoSymbol.setAttribute("class", "fas fa-info-circle ShopIcon ShopInfo");

              infoAnchor.appendChild(infoSymbol);

            aboutWrapper.appendChild(infoAnchor);

          optionsWrapper.appendChild(purchaseWrapper);
          optionsWrapper.appendChild(aboutWrapper);

        infoWrapper.appendChild(itemImage);
        infoWrapper.appendChild(itemName);
        infoWrapper.appendChild(itemDescription);
        infoWrapper.appendChild(itemStock);
        infoWrapper.appendChild(optionsWrapper);

        var itemPrice = document.createElement("div");
        itemPrice.setAttribute("class", "ShopItemPriceOverlay");

          var normalPrice = document.createElement("span");
          normalPrice.textContent = item.cost;
          var rupee = document.createElement("img"); 
          rupee.setAttribute("class", "ShopRupeeImage");
          var rupeeSrc = "";
          if (item.discounted_cost !== null) {
            normalPrice.setAttribute("class", "ShopItemHasDiscount");
            rupeeSrc = getRupeeColorFromCost(item.discounted_cost);
            itemPrice.textContent = " " + item.discounted_cost + " (" + calculatePercentageDiscount(item.cost, item.discounted_cost) + "%)";
            itemWrapper.setAttribute("data-cost", item.discounted_cost);
          } else {
            rupeeSrc = getRupeeColorFromCost(item.cost);
          }
          rupee.setAttribute("src", "../images/rupeeshop/" + rupeeSrc);

        itemPrice.prepend(normalPrice);
        itemPrice.prepend(rupee);

      itemWrapper.appendChild(infoWrapper);
      itemWrapper.appendChild(itemPrice);

      $shopItemList.append(itemWrapper);
      index = index + 1;
    }
  }
  $(".ShopItem").hide();

  // Extremely hacky way of setting the dynamic sidebar even though the shop is visible
  $("#ShopContainer").css({ position: "absolute", visibility: "hidden", display: "block" });
  if ($("#ShopSidebar").width() < 210) {
    $("#ShopSidebar").width("210px");
  }
  var sidebarWidth = $("#ShopSidebar").width();
  $("#ShopContent").css("margin-left", (sidebarWidth + 20) + "px");
  $("#ShopContainer").css({ position: "", visibility: "", display: "none" });
}

function getRupeeColorFromCost(cost) {
  var rupeeSrc = "";
  if (cost < 1000) {
    rupeeSrc = "Rupee_Green.png";
  } else if (cost >= 1000 && cost < 5000) {
    rupeeSrc = "Rupee_Blue.png";
  } else if (cost >= 5000 && cost < 15000) {
    rupeeSrc = "Rupee_Red.png";
  } else if (cost >= 15000 && cost < 30000) {
    rupeeSrc = "Rupee_Purple.png";
  } else if (cost >= 30000 && cost < 50000) {
    rupeeSrc = "Rupee_Silver.png";
  } else {
    rupeeSrc = "Rupee_Gold.png";
  }
  return rupeeSrc;
}

function calculatePercentageDiscount(original, discount) {
  return Math.floor((1 - (discount / original)) * 100);
}

function setupShopSorting() {
  $("#ShopContentSortDropdownLink").on("click", function () {
    if ($(this).hasClass("ShopSortDropdownVisible")) {
      $("#ShopCloseSortMenu").trigger("click");
    } else {
      $(this).addClass("ShopSortDropdownVisible");
      $("#ShopSortMenu").show();
      $("#ShopContentSort .fa-angle-up").show();
      $("#ShopContentSort .fa-angle-down").hide();
    }
  });

  $("input[name='ShopSortOptions']").on("change", function () {
    $(".ShopItem.ShopItemHidden").css({ position: "absolute", visibility: "hidden", display: "block" });
    var $divs = $(".ShopItem");
    var $this = $(this);
    var sortedDivs = "";
    if ($this.val() === "type") {
      sortedDivs = $divs.sort(function (a, b) {
        return $(a).data("index") > $(b).data("index");
      });
    } else if ($this.val() === "nameaz") {
      sortedDivs = $divs.sort(function(a, b) {
        return $(a).data("name") > $(b).data("name");
      });
    } else if ($this.val() === "nameza") {
      sortedDivs = $divs.sort(function(a, b) {
        return $(a).data("name") < $(b).data("name");
      });
    } else if ($this.val() === "costasc") {
      sortedDivs = $divs.sort(function(a, b) {
        return $(a).data("cost") > $(b).data("cost");
      });
    } else if ($this.val() === "costdsc") {
      sortedDivs = $divs.sort(function(a, b) {
        return $(a).data("cost") < $(b).data("cost");
      });
    }
    $("#ShopContentSortSelected").html($this.data("display"));
    $("#ShopItemList").html(sortedDivs);
    $(".ShopItem.ShopItemHidden").css({ position: "", visibility: "", display: "none" });
  });

  $("#ShopCloseSortMenu").on("click", function () {
    $(".ShopSortDropdownVisible").removeClass("ShopSortDropdownVisible");
    $("#ShopSortMenu").hide();
    $("#ShopContentSort .fa-angle-up").hide();
    $("#ShopContentSort .fa-angle-down").show();
  });
}