'use strict';

function CssUtils( sheet ) {
    if( sheet.constructor.name === 'CSSStyleSheet' ) this.sheet = sheet;
    else if( sheet.constructor.name === 'HTMLStyleElement') this.sheet = sheet.sheet;
    else throw new TypeError( sheet + ' is not a StyleSheet' );
}

CssUtils.prototype = {
    constructor : CssUtils,
    add  : function( cssText ){
        return this.sheet.insertRule( cssText, this.sheet.cssRules.length );
    },
    del  : function( index ) {
        return this.sheet.deleteRule( index );
    },
    edit : function( index, cssText ){
        var i;
        if( index < 0 ) index = 0;
        if( index >= this.sheet.cssRules.length ) return this.add( cssText );
        i = this.sheet.insertRule( cssText, index );
        if( i === index ) this.sheet.deleteRule( i + 1 );
        return i;
    }
};

angular.module('mgeditor', [])

.controller('main', function($scope) {
  $scope.components = [
  {name: 'Heading', template: '<h1 class="unit editable" data-unit-type="Heading" data-droppable-to="DIV">Heading</h1>'},
  {name: 'Sub Heading', template: '<h2 class="unit editable" data-unit-type="Sub Heading" data-droppable-to="DIV">Sub Heading</h2>'},
  {name: 'Paragraph', template: '<p class="unit editable" data-unit-type="Paragraph" data-droppable-to="DIV">Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.</p>'},
  {name: 'Section', template: '<div class="unit section droppable" data-unit-type="Section" data-droppable-to="DIV,BODY"></div>'},
  {name: 'Container', template: '<div class="unit container droppable" data-droppable-to="DIV,BODY" data-unit-type="Container"></div>'},
  {name: 'Two Col', template: '<div class="unit twocol droppable" data-droppable-to="DIV,BODY" data-unit-type="Two Col"><div class="unit container droppable" data-droppable-to="DIV,BODY" data-unit-type="Container"></div><div class="unit container droppable" data-droppable-to="DIV,BODY" data-unit-type="Container"></div><div class="clearfix"></div></div>'}
  ]
})

.directive('mgPageCanvas', function($rootScope) {
  return {
    restrict: 'A',
    scope: {},
    link: function(scope, element, attrs) {
      element.on('load', function(e) {
        var canvasDoc = $(element[0].contentDocument);
	var cssSheet = new CssUtils(element[0].contentDocument.head.appendChild(element[0].contentDocument.createElement('style')))
        var execCommandOnElement = function (el, commandName, value) {
          if (typeof value == "undefined") {
            value = null;
          }
          var wsWindow = element[0].contentWindow;
          var wsDocument = element[0].contentDocument;
          if (typeof wsDocument.getSelection != "undefined") {
            wsDocument.designMode = "on";
            wsDocument.execCommand(commandName, false, value);
            wsDocument.designMode = "off";
          }
        }

        var element_move_data = {};
        var overide_drop_target = null;

        $rootScope.$on('elementmovestart', function(e, data) {
          element_move_data = data;
        });

        canvasDoc.on('dragenter', function(e) {
          overide_drop_target = null;
          var target = $(e.originalEvent.target);
          if(!element_move_data.move || !target.closest('.selected').length) {
            var indicator = $('#drag_indicator');
            indicator
                .removeClass('hide')
                .width(target.width()  + parseInt(target.css('padding-left')) + parseInt(target.css('padding-right')) )
                .css('left', target.offset().left)
            if(element_move_data.droppableTo.indexOf(target.prop('tagName')) > -1) {
              indicator.css('top', target.offset().top + parseInt(target.css('padding-top')) - $(element[0].contentWindow).scrollTop());
            }
            else {
              indicator.css('top', target.offset().top + target.height() + parseInt(target.css('padding-top')) + parseInt(target.css('padding-bottom')) + parseInt(target.css('margin-top')) - -$(element[0].contentWindow).scrollTop());
            }
          }
          e.preventDefault();
          return false;
        });

        canvasDoc.on('dragover', function(e) {
          var target = $(e.originalEvent.target);
          if(!element_move_data.move || !target.closest('.selected').length) {
            var indicator = $('#drag_indicator');
            if(element_move_data.droppableTo.indexOf(target.prop('tagName')) > -1) {
              target
                .children()
                .each(function(i, child) {
                  var elm = $(child);
                  if( elm.offset().top + elm.height() + parseInt(elm.css('padding-top')) + parseInt(elm.css('padding-bottom')) < e.originalEvent.offsetY) {
                    indicator.css('top', elm.offset().top + elm.height() + parseInt(elm.css('padding-top')) + parseInt(elm.css('padding-bottom')) + parseInt(elm.css('margin-top')));
                    overide_drop_target = elm;
                  }
              });
            }
          }
          e.preventDefault();
          return false;
        });

        canvasDoc.on('drop', function(e) {
          $('#drag_indicator').addClass('hide');
          var target = $(e.originalEvent.target);
          if(!element_move_data.move || !target.closest('.selected').length) {
            var drop_data = element_move_data;
            if(element_move_data.droppableTo.indexOf(target.prop('tagName'))> -1) {
              if(overide_drop_target!=null) {
                overide_drop_target.after(drop_data.html);
              } else {
                target.prepend(drop_data.html);

              }
            }
            else {
              target.after(drop_data.html);
            }
            if(element_move_data.move) {
              canvasDoc.find('.selected').remove();
              $('#select_highlight').addClass('hide');
            }
          }
          element_move_data = {};
          $('#drag_indicator span').html('Insert Here')
          e.stopPropagation();
        });

        canvasDoc.on('mouseover', '.unit',  function(e) {
          if(!$(this).hasClass('selected') && !canvasDoc.find('.editing').length && !$(this).parents('.position_on').length) {
            $('#mouseover_highlight .type').html($(this).data('unit-type'));
            $('#mouseover_highlight').width($(this).width() + parseInt($(this).css('padding-right')) + parseInt($(this).css('padding-left')));
            $('#mouseover_highlight').height($(this).height() + parseInt($(this).css('padding-top'))  + parseInt($(this).css('padding-bottom')));
            $('#mouseover_highlight').css('left', $(this).offset().left);
            $('#mouseover_highlight').css('top', $(this).offset().top-$(element[0].contentWindow).scrollTop());
            $('#mouseover_highlight').data('top', $(this).offset().top);
            $('#mouseover_highlight').removeClass('hide');

            if(!canvasDoc.find('.position_on').length) {

              $('.margin_highlight').removeClass('hide');

              $('.margin_highlight.top').height(parseInt($(this).css('margin-top')));
              $('.margin_highlight.top').width($(this).width() + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')));

              $('.margin_highlight.top').css('top', $(this).offset().top - parseInt($(this).css('margin-top'))-$(element[0].contentWindow).scrollTop());
              $('.margin_highlight.top').data('top', $(this).offset().top - parseInt($(this).css('margin-top')));
              $('.margin_highlight.top').css('left', $(this).offset().left);



              $('.margin_highlight.right').width(parseInt($(this).css('margin-right')));
              $('.margin_highlight.right').height($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')) + parseInt($(this).css('margin-bottom')) + parseInt($(this).css('margin-top')));
              $('.margin_highlight.right').css('left', $(this).offset().left + $(this).width() + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')));
              $('.margin_highlight.right').css('top', $(this).offset().top - parseInt($(this).css('margin-top'))-$(element[0].contentWindow).scrollTop());
              $('.margin_highlight.right').data('top', $(this).offset().top - parseInt($(this).css('margin-top')));


              $('.margin_highlight.bottom').height(parseInt($(this).css('margin-bottom')));
              $('.margin_highlight.bottom').width($(this).width() + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')));
              $('.margin_highlight.bottom').css('top', $(this).offset().top + $(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom'))-$(element[0].contentWindow).scrollTop());
              $('.margin_highlight.bottom').data('top', $(this).offset().top + $(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')));
              $('.margin_highlight.bottom').css('left', $(this).offset().left);


              $('.margin_highlight.left').width(parseInt($(this).css('margin-left')));
              $('.margin_highlight.left').height($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')) + parseInt($(this).css('margin-bottom')) + parseInt($(this).css('margin-top')));
              $('.margin_highlight.left').css('top', $(this).offset().top - parseInt($(this).css('margin-top'))-$(element[0].contentWindow).scrollTop());
              $('.margin_highlight.left').data('top', $(this).offset().top - parseInt($(this).css('margin-top')));
              $('.margin_highlight.left').css('left', $(this).offset().left - parseInt($(this).css('margin-left')));


              $('.padding_highlight').removeClass('hide');

              $('.padding_highlight.top').height(parseInt($(this).css('padding-top')));
              $('.padding_highlight.top').width($(this).width());

              $('.padding_highlight.top').css('top', $(this).offset().top-$(element[0].contentWindow).scrollTop());
              $('.padding_highlight.top').data('top', $(this).offset().top);
              $('.padding_highlight.top').css('left', $(this).offset().left + parseInt($(this).css('padding-left')));



              $('.padding_highlight.right').width(parseInt($(this).css('padding-right')));
              $('.padding_highlight.right').height($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')));
              $('.padding_highlight.right').css('left', $(this).offset().left + $(this).width() + parseInt($(this).css('padding-left')));
              $('.padding_highlight.right').css('top', $(this).offset().top-$(element[0].contentWindow).scrollTop());
              $('.padding_highlight.right').data('top', $(this).offset().top);


              $('.padding_highlight.bottom').height(parseInt($(this).css('padding-bottom')));
              $('.padding_highlight.bottom').width($(this).width());
              $('.padding_highlight.bottom').css('top', $(this).offset().top + $(this).height() + parseInt($(this).css('padding-top'))-$(element[0].contentWindow).scrollTop());
              $('.padding_highlight.bottom').data('top', $(this).offset().top + $(this).height() + parseInt($(this).css('padding-top')));
              $('.padding_highlight.bottom').css('left', $(this).offset().left + parseInt($(this).css('padding-left')));


              $('.padding_highlight.left').width(parseInt($(this).css('padding-left')));
              $('.padding_highlight.left').height($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')));
              $('.padding_highlight.left').css('top', $(this).offset().top-$(element[0].contentWindow).scrollTop());
              $('.padding_highlight.left').data('top', $(this).offset().top);
              $('.padding_highlight.left').css('left', $(this).offset().left);
            }
          }
          e.stopPropagation();
        });

        canvasDoc.on('mouseout', '.unit',  function(e) {
          $('#mouseover_highlight').addClass('hide');
          if(!canvasDoc.find('.position_on').length) {
            $('.margin_highlight').addClass('hide');
            $('.padding_highlight').addClass('hide');
          }
        });

        canvasDoc.on('click', '.unit',  function(e) {
          if(!$(this).hasClass('selected')) {
            $('.margin_highlight').addClass('hide');
            $('.padding_highlight').addClass('hide');
            $('#position_highlight').addClass('hide');
            $('#select_highlight .delete').removeClass('hide')
            $('#select_highlight .draghandle').removeClass('hide');
            canvasDoc.find('.selected').removeClass('selected').removeClass('position_on');
            $(this).addClass('selected');
            canvasDoc.find('.editing').removeClass('editing').removeAttr('contenteditable');
            if($(this).data('no-delete')===true) {
              $('#select_highlight .delete').addClass('hide');
            }
            if($(this).data('no-move')===true) {
              $('#select_highlight .draghandle').addClass('hide');
            }
            $('#select_highlight .type').html($(this).data('unit-type'));
            $('#select_highlight').width($(this).width() + parseInt($(this).css('padding-right')) + parseInt($(this).css('padding-left')));
            $('#select_highlight').height($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom')));
            $('#select_highlight').css('left', $(this).offset().left);
            $('#select_highlight').css('top', $(this).offset().top-$(element[0].contentWindow).scrollTop());
            $('#select_highlight').data('top', $(this).offset().top);
            $('#select_highlight').removeClass('hide');
            $('#mouseover_highlight').addClass('hide');
            $('#text_formatters').addClass('hide');
          }
          e.stopPropagation();
        });

        canvasDoc.on('dblclick', '.editable', function(e) {
          $(this).attr('contenteditable', 'true');
          $(this).addClass('editing');
          $('#text_formatters').css('left', $(this).offset().left - 40);
          $('#text_formatters').css('top', $(this).offset().top-26 -$(element[0].contentWindow).scrollTop());
          $('#text_formatters').data('top', $(this).offset().top-26);
          $('#text_formatters').removeClass('hide');
        });
        var deleteUnit = function(e) {
          if(e.keyCode === 8 && e.originalEvent.srcElement.contentEditable!='true') {
            if(canvasDoc.find('.selected').data('no-delete')!==true) {
              $('#select_highlight').addClass('hide');
              canvasDoc.find('.selected').remove();
            }
            e.preventDefault();
          }
        }
        $(document).on('keydown', deleteUnit);
        canvasDoc.on('keydown', deleteUnit);

        $('#select_highlight .delete').on('click', function() {
          if(canvasDoc.find('.selected').data('no-delete')!==true) {
            $('#select_highlight').addClass('hide');
            $('#position_highlight').addClass('hide');
            $('.margin_highlight').addClass('hide');
            $('.padding_highlight').addClass('hide');
            canvasDoc.find('.selected').remove();
          }
        })

        $('#text_formatters').on('click', 'a', function(e){
          execCommandOnElement(canvasDoc.find('.editing')[0], $(this).data('command'));
        })

        $('#select_highlight .draghandle').on('dragstart', function (e) {
          element_move_data = {html: $('<div>').append(canvasDoc.find('.selected').clone().removeClass('selected')).html(), droppableTo: canvasDoc.find('.selected').data('droppableTo').split(','), move: true}
          $('#drag_indicator span').html('Move ' + canvasDoc.find('.selected').data('unit-type') + ' Here')
          $('#position_highlight').addClass('hide');
          $('.margin_highlight').addClass('hide');
          $('.padding_highlight').addClass('hide');
        });

        $(element[0].contentWindow).on('scroll', function(e) {
          console.log('scrolling');
          $('#select_highlight, #mouseover_highlight, .margin_highlight, .padding_highlight, #position_highlight, #text_formatters')
            .each(function(i, el) {
              $(el).css('top', $(el).data('top') - $(element[0].contentWindow).scrollTop());
            })
        })

        $('#select_highlight .position').on('click', function (e) {
            var current = canvasDoc.find('.selected').addClass('position_on');

            $('.margin_highlight').removeClass('hide');

            $('.margin_highlight.top').height(parseInt(current.css('margin-top')));
            $('.margin_highlight.top').width(current.width() + parseInt(current.css('padding-left')) + parseInt(current.css('padding-right')));

            $('.margin_highlight.top').css('top', current.offset().top - parseInt(current.css('margin-top'))-$(element[0].contentWindow).scrollTop());
            $('.margin_highlight.top').data('top', current.offset().top - parseInt(current.css('margin-top')));
            $('.margin_highlight.top').css('left', current.offset().left);



            $('.margin_highlight.right').width(parseInt(current.css('margin-right')));
            $('.margin_highlight.right').height(current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom')) + parseInt(current.css('margin-bottom')) + parseInt(current.css('margin-top')));
            $('.margin_highlight.right').css('left', current.offset().left + current.width() + parseInt(current.css('padding-left')) + parseInt(current.css('padding-right')));
            $('.margin_highlight.right').css('top', current.offset().top - parseInt(current.css('margin-top'))-$(element[0].contentWindow).scrollTop());
            $('.margin_highlight.right').data('top', current.offset().top - parseInt(current.css('margin-top')));


            $('.margin_highlight.bottom').height(parseInt(current.css('margin-bottom')));
            $('.margin_highlight.bottom').width(current.width() + parseInt(current.css('padding-left')) + parseInt(current.css('padding-right')));
            $('.margin_highlight.bottom').css('top', current.offset().top + current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom'))-$(element[0].contentWindow).scrollTop());
            $('.margin_highlight.bottom').data('top', current.offset().top + current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom')));
            $('.margin_highlight.bottom').css('left', current.offset().left);


            $('.margin_highlight.left').width(parseInt(current.css('margin-left')));
            $('.margin_highlight.left').height(current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom')) + parseInt(current.css('margin-bottom')) + parseInt(current.css('margin-top')));
            $('.margin_highlight.left').css('top', current.offset().top - parseInt(current.css('margin-top'))-$(element[0].contentWindow).scrollTop());
            $('.margin_highlight.left').data('top', current.offset().top - parseInt(current.css('margin-top')));
            $('.margin_highlight.left').css('left', current.offset().left - parseInt(current.css('margin-left')));


            $('.padding_highlight').removeClass('hide');

            $('.padding_highlight.top').height(parseInt(current.css('padding-top')));
            $('.padding_highlight.top').width(current.width());

            $('.padding_highlight.top').css('top', current.offset().top-$(element[0].contentWindow).scrollTop());
            $('.padding_highlight.top').data('top', current.offset().top);
            $('.padding_highlight.top').css('left', current.offset().left + parseInt(current.css('padding-left')));

            $('.padding_highlight.right').width(parseInt(current.css('padding-right')));
            $('.padding_highlight.right').height(current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom')));
            $('.padding_highlight.right').css('left', current.offset().left + current.width() + parseInt(current.css('padding-left')));
            $('.padding_highlight.right').css('top', current.offset().top-$(element[0].contentWindow).scrollTop());
            $('.padding_highlight.right').data('top', current.offset().top);


            $('.padding_highlight.bottom').height(parseInt(current.css('padding-bottom')));
            $('.padding_highlight.bottom').width(current.width());
            $('.padding_highlight.bottom').css('top', current.offset().top + current.height() + parseInt(current.css('padding-top'))-$(element[0].contentWindow).scrollTop());
            $('.padding_highlight.bottom').data('top', current.offset().top + current.height() + parseInt(current.css('padding-top')));
            $('.padding_highlight.bottom').css('left', current.offset().left + parseInt(current.css('padding-left')));


            $('.padding_highlight.left').width(parseInt(current.css('padding-left')));
            $('.padding_highlight.left').height(current.height() + parseInt(current.css('padding-top')) + parseInt(current.css('padding-bottom')));
            $('.padding_highlight.left').css('top', current.offset().top-$(element[0].contentWindow).scrollTop());
            $('.padding_highlight.left').data('top', current.offset().top);
            $('.padding_highlight.left').css('left', current.offset().left);

            $('#position_highlight')
              .width(current.width())
              .height(current.height())
              .css('left', current.offset().left + parseInt(current.css('padding-left')))
              .css('top', current.offset().top  + parseInt(current.css('padding-top'))-$(element[0].contentWindow).scrollTop())
              .data('top', current.offset().top  + parseInt(current.css('padding-top')))
              .removeClass('hide');

            $('#position_highlight .width').html(current.css('width'));
            $('#position_highlight .height').html(current.css('height'));

        });

      });
    }
  }
})

.directive('mgComponent', function ($rootScope) {
  return {
    restrict: 'A',
    scope: {},
    link: function(scope, element, attrs) {
      element.on('dragstart', function(e) {
        var data =  {html: element.data('template'), droppableTo: $(element.data('template')).data('droppable-to').split(',')}
        e.originalEvent.dataTransfer.setData('application/json', JSON.stringify(data));
        $rootScope.$broadcast('elementmovestart', data);
        $('#select_highlight').addClass('hide');
        $('#position_highlight').addClass('hide');
        $('.margin_highlight').addClass('hide');
        $('.padding_highlight').addClass('hide');
        $('.selected', $('#workspace')[0].contentDocument).removeClass('selected');
      });
    }
  }
});
