// JavaScript Document

function iframeMutationObserver(el,attr,subject) {
  var mutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  //if($ngchatdebug){
	//console.log("ng chat: el",el);
  //}
  if(el){
	console.log("ng chat: el x",el);
	var observer = new mutationObserver(function(mutations) {
	  mutations.forEach(function(mutation) {
		//if($ngchatdebug){
		  console.log("ng chat: mutation.target.getAttribute(mutation.attributeName)",mutation.target.getAttribute(mutation.attributeName));
		//}
		var obj = mutation.target.getAttribute(mutation.attributeName);
		console.log("ng chat: obj",obj);
		return subject.next(obj);
	  });    
	});
	var config = {attributes:true,childList:true,characterData:false,attributeFilter:[attr]};
	observer.observe(el,config);
  }
}