function formatConvert(list) {
    /*
    example:
    input:
    [8,8,8,8,7,6,5,4,3,2,1,0,0,0]
    output:
    [[14, 3, 1, 1, 1, 1, 1, 1, 1, 4], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    */
    var cardsList = [];
    var w = [];
    var t = [];
    var s = [];
    var z = [];
    for (var k = 0; k < 9; k++) {
        w.push(list.reduce(function (total, x) {
            return x == k ? total + 1 : total;
        }, 0));
    }
    for (var k = 9; k < 18; k++) {
        t.push(list.reduce(function (total, x) {
            return x == k ? total + 1 : total;
        }, 0));
    }
    for (var k = 18; k < 27; k++) {
        s.push(list.reduce(function (total, x) {
            return x == k ? total + 1 : total;
        }, 0));
    }
    for (var k = 27; k < 36; k++) {
        z.push(list.reduce(function (total, x) {
            return x == k ? total + 1 : total;
        }, 0));
    }
    w.unshift(w.reduce(function (a, b) { return a + b; }));
    t.unshift(t.reduce(function (a, b) { return a + b; }));
    s.unshift(s.reduce(function (a, b) { return a + b; }));
    z.unshift(z.reduce(function (a, b) { return a + b; }));
    cardsList.push(w);
    cardsList.push(t);
    cardsList.push(s);
    cardsList.push(z);
    return cardsList;
}
function isLegal(list, flag) {
    /*
    Check if a list is legal
    To be legal, the list should be able to remove three identical cards or to
    remove three consecutive cards until the list is empty.
    */
    if (list[0] === 0) {
        return true;
    }
    var index = 0;
    for (var j = 1; j < list.length; j++) {
        if (list[j] !== 0) {
            index = j;
            break;
        }
    }
    var result = false;
    if (list[index] >= 3) {
        list[index] -= 3;
        list[0] -= 3;
        result = isLegal(list, flag);
        list[index] += 3;
        list[0] += 3;
        return result;
    }
    if (!flag && index < 8 && list[index + 1] > 0 && list[index + 2] > 0) {
        list[index] = list[index] - 1;
        list[index + 1] = list[index + 1] - 1;
        list[index + 2] = list[index + 2] - 1;
        list[0] = list[0] - 3;
        result = isLegal(list, flag);
        list[index] = list[index] + 1;
        list[index + 1] = list[index + 1] + 1;
        list[index + 2] = list[index + 2] + 1;
        list[0] = list[0] + 3;
        return result;
    }
    return false;
}
function ifHu(cards) {
    /*
    input:  arr of integer (range [0-33]) presenting current hand,
            the possible lengths are 5, 8, 11, 14
            0-8 represent Char 1~9
            9-17 represent Circle 1~9
            18-26 represent Bamboo 1~9
            27-33 represent Special Char
            example input: [8,8,8,8,7,6,5,4,3,2,1,0,0,0]
    return: bool, true if this hand could win, false if not
    */
    if ([5, 8, 11, 14].indexOf(cards.length) == -1) {
        console.log("length of arr is illegal.");
        throw "number of cards is illegal";
    }
    var cardsNewFormat = formatConvert(cards);
    //console.log(cardsNewFormat);
    var kingPos = -1;
    var kingExist = false;
    for (var j = 0; j < 4; j++) {
        var additionalCards = cardsNewFormat[j][0] % 3;
        if (additionalCards == 1) {
            return false;
        }
        if (additionalCards == 2) {
            if (kingExist) {
                return false;
            }
            kingPos = j;
            kingExist = true;
        }
    }
    if (!kingExist) {
        return false;
    }
    for (var j = 0; j < 4; j++) {
        if (kingPos == j) {
            continue;
        }
        else {
            if (!isLegal(cardsNewFormat[j], j == 3)) {
                return false;
            }
        }
    }
    var kingList = cardsNewFormat[kingPos];
    for (var j = 1; j < kingList.length; j++) {
        if (kingList[j] >= 2) {
            kingList[j] -= 2;
            kingList[0] -= 2;
            if (isLegal(kingList, kingPos == 3)) {
                return true;
            }
            else {
                kingList[j] += 2;
                kingList[0] += 2;
            }
        }
    }
    return false;
}
function ifChi(hand, target) {
    if ([7, 10, 13].indexOf(hand.length) == -1) {
        console.log("length of arr is illegal.");
        throw "number of cards is illegal";
    }
    // convert to [[14, 3, 1, 1, 1, 1, 1, 1, 1, 4], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    var cardsNewFormat = formatConvert(hand);
    var stackIndex = Math.floor(target / 9);
    var index = target % 9;
    if (stackIndex == 3) {
        return false;
    }
    var targetList = cardsNewFormat[stackIndex];
    // The index 0 in targetList is the total count. 
    if (index >= 2) {
        if (targetList[index] >= 1 && targetList[index - 1] >= 1) {
            return true;
        }
    }
    if (index >= 1 && index <= 7) {
        if (targetList[index] >= 1 && targetList[index + 2] >= 1) {
            return true;
        }
    }
    if (index <= 6) {
        if (targetList[index + 2] >= 1 && targetList[index + 3] >= 1) {
            return true;
        }
    }
    return false;
}
function ifPeng(hand, target) {
    if ([7, 10, 13].indexOf(hand.length) == -1) {
        console.log("length of arr is illegal.");
        throw "number of cards is illegal";
    }
    return hand.reduce(function (total, x) {
        return x == target ? total + 1 : total;
    }, 0) >= 2;
}
//# sourceMappingURL=helper.js.map