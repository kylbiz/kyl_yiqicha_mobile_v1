Router.configure({
    notFoundTemplate: 'notFoundTemplate'
})

Router.map(function(){
  this.route('notFound', {
      path: '/404',
      template: 'notFoundTemplate'
  });

  this.route('/', {
      name: 'kylCompanyName',
      data: function() {
          var self = this;
          Meteor.subscribe('getCompanySearchTimes');     
          
          CompanySearchTimes.find({'keywords': 'registration'}).forEach(function(companySearchTime) {
              self.times =  companySearchTime.times
          })      
          return {
              times: self.times
          }

      }        
  })


  function handleKeywords(keywords, zone) {
    var keywordsLength = keywords.length;

    if(typeof keywords === 'string' && keywordsLength >= 2) {
       zone = zone || '上海'; // we only use this for shanghai province , china

      if(keywords.indexOf(zone) >= 0) {
        if(keywordsLength >= 4) {
          return {flag: true, searchKeywords: [keywords]};
        } else {
          return {flag: false, searchKeywords: []};
        }
      } else {
        searchKeywords = [zone + keywords, keywords + '（' + zone + '）'];
        // alert(searchKeywords)
        return {flag: true, searchKeywords: searchKeywords}
      }
    } else {
      return {flag: false, searchKeywords: []}

    }
  }


  this.route('/registration', {
    name: 'searchRegistrationResults',
    subscriptions: function() {
      var keywords = this.params.query.keywords || "";
      return Meteor.subscribe("registrationLists", keywords)
    },
    data: function() {
      var keywords = this.params.query.keywords || "";
      var uuid = this.params.query.uuid || "";
      Session.set("keywords", keywords);
      Session.set("uuid", uuid);

      var zone = '上海';

      var keywordsHandleResults = handleKeywords(keywords, zone);
      var keywordsArray = keywordsHandleResults.searchKeywords;

      var keywordsString = '';
      for (var i = 0; i < keywordsArray.length - 1; i++) {
        keywordsString += keywordsArray[i] + '|';
      }
      keywordsString += keywordsArray[keywordsArray.length - 1];

      var registrations = Registration.find({
        companyName: new RegExp(keywordsString)
      });

      var registrationLength = registrations.count() || 0;
     
      Session.set("registrationLength", registrationLength);
      
      var allpageNo = 0;
      var currentpage = 1;
      var numberOfResults = registrationLength;
      // var readyflag = false;
      var hasnextpage = false;

      var searchrecords = CompanySearchRecords.findOne({
        'uuid': uuid
      });
      if (searchrecords) {
        allpageNo = searchrecords.allpageNo || 0;
        numberOfResults = searchrecords.numberOfResults || registrationLength;
        if(registrationLength % 5 === 0) {
          currentpage = Math.floor(registrationLength / 5);
        } else {
          currentpage = Math.floor(registrationLength / 5) + 1;
        }

        Session.set("currentpage", currentpage);
        Session.set("allpageNo", searchrecords.allpageNo);
        Session.set("numberOfResults", numberOfResults);
        hasnextpage = searchrecords.allpageNo > currentpage ? true : false
      }

      return {
        registrations: registrations,
        // readyflag: readyflag,
        registrationLength: registrationLength,
        currentpage: currentpage,
        allpageNo: allpageNo,
        numberOfResults: numberOfResults,
        hasnextpage: hasnextpage
      }
    }
  });


  this.route('/status', function(){//定义路由
      var self = this;//绑定this对象
      keywords = self.params.query.keywords;

      Meteor.call('companyNameStatus', keywords, function(err, result){//调用异步方法test
          if(!err){
              self.render('companyNameStatusResult', {
                  data: function(){
                      return {
                          
                          zeroresult: result.statuscode === 0,
                          oneresult: result.statuscode === 1,
                          multiresults: result.statuscode === 2,
                          keywords: self.params.keywords,
                          companynameInfo: result.companynameInfo
                      }
                  }
              });
          }else{
              self.render('404');//如果没数据，跳转到404
          }
      })
  })


  // company registration status feedback detail
  this.route('/feedback', function(){//定义路由
      var self = this;//绑定this对象
      var keywords = self.params.query.keywords;
      Meteor.call('registrationFeedback', keywords, function(err, result){//调用异步方法test
          if(!err){
              self.render('registrationFeedbackResult', {
                  data: function(){
                      return {
                          
                          zeroresult: result.statuscode === 0,
                          oneresult: result.statuscode === 1,
                          multiresults: result.statuscode === 2,
                          keywords: self.params.keywords,
                          registrationStatusInfo: result.registrationStatusInfo
                      }
                  }
              });
          }else{
              // self.next();
              self.render('404');//如果没数据，跳转到404
          }
      })
  })
});
