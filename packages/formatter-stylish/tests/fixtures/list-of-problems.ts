import { Category, Problem, Severity } from '@hint/utils-types';

const multipleproblemsandresources: Problem[] = [{
    category: Category.other,
    hintId: 'random-hint',
    location: {
        column: 10,
        elementColumn: 10,
        elementLine: 1,
        line: 1
    },
    message: 'This is a problem in line 1 column 10',
    resource: 'http://myresource.com/',
    severity: Severity.warning,
    sourceCode: '<a href="//link.com">link</a>'
},
{
    category: Category.other,
    hintId: 'random-hint',
    location: {
        column: -1,
        line: -1
    },
    message: 'This is a problem without line in myresource',
    resource: 'http://myresource.com/',
    severity: Severity.warning,
    sourceCode: ''
},
{
    category: Category.other,
    hintId: 'random-hint',
    location: {
        column: -1,
        line: -1
    },
    message: 'This is a problem without line',
    resource: 'http://myresource2.com/this/resource/is/really/really/long/resources/image/imagewithalongname.jpg',
    severity: Severity.error,
    sourceCode: ''
},
{
    category: Category.other,
    hintId: 'random-hint',
    location: {
        column: -1,
        line: -1
    },
    message: 'This is another problem without line',
    resource: 'http://myresource2.com/this/resource/is/really/really/long/resources/image/imagewithalongname.jpg',
    severity: Severity.hint,
    sourceCode: ''
},
{
    category: Category.other,
    hintId: 'random-hint',
    location: {
        column: 4,
        elementColumn: 19,
        elementLine: 2,
        line: 2
    },
    message: 'This is a problem in line 2 column 10',
    resource: 'http://myresource.com/',
    severity: Severity.information,
    sourceCode: `<a href="//link.com">
        <img src="//image.jpg"/>
    </a>`
}];

const noproblems: Problem[] = [];

export {
    multipleproblemsandresources,
    noproblems
};
