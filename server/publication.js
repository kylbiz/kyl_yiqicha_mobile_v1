function log(info) {
  console.log('---------------------------------------------')
  var len = arguments.length;
  for (var i = 0; i < len; i++) {
    console.log(arguments[i]);
  }
}


function handleKeywords(keywords, zone) {
  var keywordsLength = keywords.length;

  if (typeof keywords === 'string' && keywordsLength >= 2) {
    zone = zone || '上海'; // we only use this for shanghai province , china

    if (keywords.indexOf(zone) >= 0) {
      if (keywordsLength >= 4) {
        return {
          flag: true,
          searchKeywords: [keywords]
        };
      } else {
        return {
          flag: false,
          searchKeywords: []
        };
      }
    } else {
      searchKeywords = [zone + keywords, keywords + '（' + zone + '）'];
      // alert(searchKeywords)
      return {
        flag: true,
        searchKeywords: searchKeywords
      }
    }
  } else {
    return {
      flag: false,
      searchKeywords: []
    }

  }
}


Meteor.publish("registrationLists", function(keywords) {
  keywords = keywords || "";
  var zone = '上海';
  var keywordsHandleResults = handleKeywords(keywords, zone);
  var keywordsArray = keywordsHandleResults.searchKeywords;

  var keywordsString = '';
  for (var i = 0; i < keywordsArray.length - 1; i++) {
    keywordsString += keywordsArray[i] + '|';
    // keywordsArray[i] = new RegExp(keywordsArray[i]);
  }
  keywordsString += keywordsArray[keywordsArray.length - 1];  

  var registrationLists = Registration.find({
    "companyName": new RegExp(keywordsString)
  }, {
    fields: {
      companyName: 1,
      companyAddress: 1,
      companyStatus: 1,
      companyId: 1,
      basicDetail: 1
    }
  });

  var record = CompanySearchRecords.find({
    keywords: keywords
  });

  return [registrationLists, record];

})
