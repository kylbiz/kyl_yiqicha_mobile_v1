var Crawler = Meteor.npmRequire('mycrawl').Crawler;
var crawler = new Crawler();

var verifyStr = "kyl_yiqicha";

var registrationOptions = {
  homeRefererUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=index', 
  registrationResultsUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch', 
  registrationDetailUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=viewDetail' 
};


var companyStatusOptions = {
  targetUrl: 'http://www.sgs.gov.cn/shaic/workonline/appStat!toNameAppList.action'
};

var registrationStatusOption = {
  targetUrl : 'http://www.sgs.gov.cn/shaic/workonline/appStat!toEtpsAppList.action'
}



function log(info) {
  console.log('-----------------------------------------')
  var len = arguments.length;
  for(var i =0; i < len; i++) {
    console.log(arguments[i]);
  }
}

Meteor.onConnection(function(conn) {
  ip = conn.clientAddress || '192.168.0.1';
  clientInfo = conn.httpHeaders['user-agent']
});

var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var future = new Future();


Meteor.methods({
  crawlerRegistration: function(
    keywords, 
    uuid,
    callback) {
    if(typeof keywords !== 'string' 
      || keywords.length < 2) {
      log("crawlerRegistration: options illegal", arguments);
    } else {

      uuid = uuid || Meteor.uuid()

      Fiber(function() {
        handleRegistration(keywords, uuid);
      }).run();
    } 
  },

  //----------------------------------
  companyNameStatus: function(keywords) {

    function CompanyStatusResults(callback) {
      crawler.searchCompanyNameStatus(
        companyStatusOptions, 
        keywords, 
        function(err, companyNameStatusInfo) {
          callback(err, companyNameStatusInfo);
      });
    }
   return Async.wrap(CompanyStatusResults)();
  },

//---------------------------------------
  registrationFeedback: function(keywords) {

    function RegistrationFeedbackResults(callback) {
      crawler.searchRegistrationStatus(
        registrationStatusOption, 
        keywords, 
        function(err, registrationfeedbackInfo) {
          callback(err, registrationfeedbackInfo);
      });
    }

    return Async.wrap(RegistrationFeedbackResults)();
  },

  getMoreRegistrations: function(
    keywords,
    allpageNo, 
    pageNo) {
    crawler.getMoreRegistrations(
      registrationOptions, 
      keywords, 
      allpageNo, 
      pageNo,
      function(err, moreRegistrations) {
        if(err) {
          log("getMoreRegistrations: get more registration about: " + keywords + " error.");
        } else {
          var detailResultsOutputs = moreRegistrations.detailResultsOutputs; 

          Fiber(function() {
            // 存储查询到的工商核名信息
            detailResultsOutputs.forEach(function(registrationResult) {
              var company = registrationResult.company;

              Registration.update({
                'companyName': company.companyName
              }, {
                companyName: company.companyName,
                companyId: company.companyId,
                companyQueryId: company.companyQueryId,
                companyStatus: company.companyStatus,
                companyAddress: company.address,
                basicDetail: registrationResult.basicDetail,
                annualCheckDetail: registrationResult.annualCheckDetail,
                createTime: new Date(),
                server: 'h.kyl.biz'
              }, {
                upsert: true
              }, function(err) {
                if(err) {
                  log('getMoreRegistrations: save registration error', err);     
                } else {
                  log('getMoreRegistrations: save registration succeed.');
                }
              })
            });
          }).run();
        }
    })
  }
});


var verifyKeywords = function(keywords) {
  if(typeof(keywords) !== "string"
    || !keywords.length >= 2) {
    return false;
  } else {
    return true;
  }
}

var initSearchTimes = function() {
  CompanySearchTimes.update({
    keywords: "registration",
    server: "h.kyl.biz"
  }, {
    "$inc": {
      times: 1
    }
  }, {
    upsert: true
  }, function(err) {
    if(err) {
      log('Save keywords to CompanySearchTimes error', err);
    } else {
      log('Save keywords to CompanySearchTimes succeed');
    }
  });  
}

var initSearchRecords = function(options) {
  if(!options
    || !options.hasOwnProperty("keywords")
    || !options.hasOwnProperty("uuid")) {
    log("initSearchRecords: options illegal.", options);
  } else {
    var keywords = options.keywords;
    var uuid = options.uuid;
    CompanySearchRecords.insert({
      keywords: keywords,
      ip: ip,
      timestamp: new Date(),
      clientInfo: clientInfo,
      numberOfResults: 0,
      allpageNo: 0,
      readyflag: false,
      uuid: uuid,
      server: 'h.kyl.biz'
    }, function(err) {
      if(err) {
        log('save keywords to companySearchRecords error', err);
      } else {
        log('save keywords to companySearchRecords succeed');
      }
    })  
  }
}


var updateSearchRecords = function(options) {
  if(!options
    || !options.hasOwnProperty("keywords")
    || !options.hasOwnProperty("uuid")) {
    log("updateSearchRecords: options illegal.", options);
  } else {
    var keywords = options.keywords;
    var uuid = options.uuid;
    var numberOfResults = 0;
    var allpageNo = 0;

    if(options.hasOwnProperty("numberOfResults")) {
      numberOfResults = options.numberOfResults || 0;
    }

    if(options.hasOwnProperty("allpageNo")) {
      allpageNo = options.allpageNo || 0;
    }

    CompanySearchRecords.update({
      'keywords': keywords, 
      'uuid': uuid
    }, {
      $set: {
        numberOfResults: numberOfResults,
        allpageNo: allpageNo,
        readyflag: true
      }
    }, {
      upsert: true
    }, function(err) {
      if(err) {
        log("updateSearchRecords: update search keywords: " + keywords + " error.", err);
      } else {
        log("updateSearchRecords: update search keywords: " + keywords + " succeed.");
      }
    });
  }
}


function handleRegistration(keywords, uuid) {
  // 初始化核名记录
  Fiber(function() {
    var options = {
      keywords: keywords,
      uuid: uuid
    }
    initSearchRecords(options);
  }).run()

  // 抓取核名信息
  crawler.searchCompanyInformation(
    registrationOptions, 
    keywords, 
    function(err, results) {
      if(err) {
        log('search company information error', err);
      } else{
        log('Got registrations from server :', results , 'Then save to database.');

        var numberOfResults = results.numberOfResults;
        var allpageNo = results.allpageNo || 0;
        var registrationResults =results.detailResultsOutputs || 0; 

        if(numberOfResults !== 0){
          Fiber(function() {
            // 存储查询到的工商核名信息
            registrationResults.forEach(function(registrationResult) {
              var company = registrationResult.company;
              var detailInformation = registrationResult.detailInformation;

              Registration.update({
                'companyName': company.companyName
              }, {
                companyName: company.companyName,
                companyId: company.companyId,
                companyQueryId: company.companyQueryId,
                companyStatus: company.companyStatus,
                companyAddress: company.address,
                basicDetail: registrationResult.basicDetail,
                annualCheckDetail: registrationResult.annualCheckDetail,
                createTime: new Date(),
                server: 'h.kyl.biz'
              }, {
                upsert: true
              }, function(err) {
                if(err) {
                  log('save registration error', err);     
                } else {
                  log('save registration succeed.');
                }
              })
            });
          }).run();
        }

        var searchOptions = {
          keywords: keywords,
          uuid: uuid,
          allpageNo: allpageNo,
          numberOfResults: numberOfResults
        }
        // 更新查询结果
        Fiber(function() {
          updateSearchRecords(searchOptions);
        }).run();
      }
  });
  
  // 更新查询次数
  Fiber(function() {
    initSearchTimes();
  }).run();  
}


//------------------------------------------------------------

function validAppId(app_id, uuid) {
  var flag = true;
  var key_pre = "kyl_app_id_";
  
  if(!app_id
    || !uuid
    || typeof("app_id") !== "string"
    || (key_pre + uuid) !== app_id) {
    flag = false;
  }
  return flag;
}

//------------------------------------------------------------

function validAppSecret(app_secret, uuid) {
  var flag = true;
  var key_pre = "kyl_app_secret_";

  if(!app_secret
    || !uuid
    || typeof("app_secret") !== "string"
    || (key_pre + uuid) !== app_secret) {
    flag = false;
  }
  return flag;
}

//------------------------------------------------------------

function validKeywords(keywords) {
  var flag = true;

  if(typeof(keywords) !== "string"
    || keywords.length < 2) {
    flag = false;
  }
  return flag;
}

//------------------------------------------------------------

HTTP.methods({
  "/registration/service": {
    "post": function(data) {
      data = querystring.parse(data.toString());
      if(typeof(data) !== "object"
        || !data.hasOwnProperty("keywords")
        || !validKeywords(data["keywords"])
        || !data.hasOwnProperty("uuid")
        || !data.hasOwnProperty("app_id")
        || !data.hasOwnProperty("app_secret")
        || !validAppId(data["app_id"], data["uuid"])
        || !validAppSecret(data["app_secret"], data["uuid"])
        ) {
        return {status: 403, message: "options illegal."};
      } else {
        var keywords = data.keywords || "";
        var uuid = data.uuid;

        Fiber(function() {
          handleRegistration(keywords, uuid);
        }).run();
      }
    }
  }
});
