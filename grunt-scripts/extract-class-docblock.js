/* eslint-disable */
module.exports = function extractClassDef(text) {
  const result = {
    code: '',
    def: ''
  };
  var indexOfClass = text.indexOf('@class');
  var indexOfClassCodeBlock = (indexOfClass !== -1) ? text.lastIndexOf('/**', indexOfClass) : -1;
  if (indexOfClassCodeBlock !== -1) {
    var endOfClassCodeBlock = text.indexOf('*/', indexOfClassCodeBlock);
    if (endOfClassCodeBlock !== -1) {
      endOfClassCodeBlock += 2;
      var prefix = text.substring(0, indexOfClassCodeBlock);
      var classComment = text.substring(indexOfClassCodeBlock, endOfClassCodeBlock);
      classComment = classComment.replace(/\n\s*\*/g, '\n *') + '\n';
      var postfix =  text.substring(endOfClassCodeBlock);
      result.code = prefix + postfix;
      result.def = classComment;
    }
  }
  if (!result.code) result.code = text;
  return result;
};
