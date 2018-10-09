//BUDGET CONTROLLER
var budgetController = (function(){

    //контрукторы для доходов и расходов для дальнейшего хранения в массиве запросов пользователя
    var Expense = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentages = function(totalIncome){

        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentages = function() {
        return this.percentage;
    };

    var Income = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function(type){
        var sum = 0;
        data.allItems[type].forEach(function(cur){
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1, //значения что расходов нет (false)
    };

    return {
        //создает новый объект в зависимости от типа (+ или -) за счет функции конструктора выше
        addItem: function(type, des, val){
            var newItem, ID;

            if (data.allItems[type].length > 0){
                //1.создаем новый айди
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1; //получаем последний номер ID + номер для нового ID
            } else {
                ID = 0;
            }
    
            //2.создаем новый эллемент на основе + или - значения
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            //3.вставляем полученные данные в новый массив
            data.allItems[type].push(newItem); //отправляем данные в массив выше
            return newItem; //для возможности доступа другим функциям
        },

        //метод для удаления
        deleteItem: function(type, id) {
            var ids, index;
            
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
            
        },

        calculateBudget: function(){

            //1.расчитать все расходы и доходы
            calculateTotal('exp');
            calculateTotal('inc');

            //2.расчитать бюджет (доход минус расход)
            data.budget = data.totals.inc - data.totals.exp;

            //3.расчитать процент дохода что потратили
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }

        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentages(data.totals.inc);
            });
        },

        getPercentages: function(){
            var allPers = data.allItems.exp.map(function(cur){
                return cur.getPercentages();
            });
            return allPers;
        },

        //вернуть полученные значения расчетов  бюджета
        getBudget: function(){
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                parsentage: data.percentage,
            }
        },

        testing: function(){
            console.log(data);
        },
    };

})();


//UI CONTROLLER
var UIController = (function(){

    // все классы в одну переменную-объект, для возможности дальнейшего изменения
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
    };

     //форматирование внешнего вида значений
    var formatNumber = function(num, type) {

        var numSplit, int, dec, type;
        //пр. 2233,3444 -> + 2,233.34
        // пр. 2000 -> - 2,000.00

        //приводим к абсолютному числу
        num = Math.abs(num);
        //фиксируем два символа после целого числа
        num = num.toFixed(2);

        numSplit = num.split('.');

        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }
        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    //возвращаем что бы возможно было читать
    return{
        getInput: function(){
            return {
                //получаем значение инпута + и -
                type: document.querySelector(DOMstrings.inputType).value,
                //получаем значение инпута описания
                description:  document.querySelector(DOMstrings.inputDescription).value,
                //получаем значение инпута цены
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
            };
        },

        addListItem: function(obj, type){
            var html, newHtml, element;
            //1.создать html строку с текстом

            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }

            //2.Заменить текст

            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            //3.Вставить в ДОМ, выбрать нужный элемент
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        //удалить из пользовательского интерфейса
        deleteListItem: function(selectorID){
             var el;

             el = document.getElementById(selectorID);
             el.parentNode.removeChild(el);
        },

        //метод для очистки полей ввода
        clearFields: function() {
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue); 

            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array) {
                current.value = '';
            });
            fieldsArr[0].focus();
        },

        //отобразить все значения шапки приложения (общее + процент)
        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            document.querySelector(DOMstrings.percentageLabel).textContent = obj.parsentage;

            if (obj.parsentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.parsentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '';
            }

        },

        //отобразить проценты у введенных полей
        displayPercentages: function(percentages) {
            
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            
            nodeListForEach(fields, function(current, index) {

                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '';
                }
            });
            
        },

        displayMonth: function() {

            var now, months, month, year;

            now = new Date();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;

        },

        //смена цвета при выборе инпута
        changedType: function() {
            
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);
            
            nodeListForEach(fields, function(cur) {
               cur.classList.toggle('red-focus'); 
            });
            
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
            
        },

        //открываем для других модулей кода объект с переменными чкерез метод объект.getDOMstrings.
        getDOMstrings: function(){
            return DOMstrings;
        },
    };

})();





//GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl){

    var setupEventListeners = function(){
        //получаем объект с классами из ЮИконтроллера
        var DOM = UICtrl.getDOMstrings();

         //доступ к кнопке
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItems);

        // нажатие ентр, если.. то.., евент.вич = для старых браузеров.
        document.addEventListener('keypress', function(event){
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItems();
            }
        });


        //выбор контейнера с введенным значением
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        //смена цвета по инпуту
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);  
    };

    var updateBudget = function(){
        //1.расчитать бюджет
        budgetCtrl.calculateBudget();

        //2.вернуть значение бюджета
        var budget = budgetCtrl.getBudget();

        //3.отобразить бюджет
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function () {

        //1.расчитать проценты
        budgetCtrl.calculatePercentages();

        //2.прочесть проценты в бюджетном контролере
        var percentage = budgetCtrl.getPercentages();

        //3.обновить ЮИ интерфейс
        UICtrl.displayPercentages(percentage);
    };

    //кнопка-ентер-инпуты
    var ctrlAddItems = function(){
        var input, newItem;

        //1.получить данные инпута (ввиде объекта)
        input = UICtrl.getInput();

        if (input.description.value !== '' && !isNaN(input.value) && input.value > 0) {
            //2.добавить полученные данные в бюджетный контроллер
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            //3.добавить элементы в интерфейс
            UICtrl.addListItem(newItem, input.type);

            //4.очистить поля
            UICtrl.clearFields();

            //5.высчитать и обновить бюджет
            updateBudget();

            //6.высчитать и обновить проценты
            updatePercentages();
        }
    };

    //функция для получения контейнера с введенной информацией
    var ctrlDeleteItem = function(event){
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        //inc-1 делим айдишник на массив из типа и номера
        if(itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
        }

        //1. удалить итем из структуры данных
        budgetCtrl.deleteItem(type, ID);

        //2. удалить из пользовательского интерфейса
        UICtrl.deleteListItem(itemID);

        //3. обновить и показать новые итоги
        updateBudget();

        //4.высчитать и обновить проценты
        updatePercentages();
        
    };

   return {
       init: function(){
           console.log('Start App');
           UICtrl.displayMonth();
           //ставим все значения в отображении на ноль
           UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                parsentage: -1,
           });
           setupEventListeners();
       }
   };

})(budgetController, UIController);

// запускаем все скрытые функции контролера
controller.init();