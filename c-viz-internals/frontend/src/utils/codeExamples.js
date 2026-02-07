// Example C code snippets for the Load Example feature

export const CODE_EXAMPLES = [
    {
        name: 'Hello World',
        code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
    },
    {
        name: 'Factorial (Recursive)',
        code: `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int num = 5;
    int result = factorial(num);
    printf("Factorial of %d is %d\\n", num, result);
    return 0;
}`
    },
    {
        name: 'Bubble Sort',
        code: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7;
    bubbleSort(arr, n);
    return 0;
}`
    },
    {
        name: 'Linked List',
        code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

struct Node* createNode(int data) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    newNode->data = data;
    newNode->next = NULL;
    return newNode;
}

void printList(struct Node* head) {
    struct Node* current = head;
    while (current != NULL) {
        printf("%d -> ", current->data);
        current = current->next;
    }
    printf("NULL\\n");
}

int main() {
    struct Node* head = createNode(1);
    head->next = createNode(2);
    head->next->next = createNode(3);
    printList(head);
    return 0;
}`
    },
    {
        name: 'Unused Variable (Static Analysis Demo)',
        code: `#include <stdio.h>

int main() {
    int usedVar = 10;
    int unusedVar = 42;  // This triggers a warning
    int anotherUnused;   // This also triggers a warning
    
    printf("Value: %d\\n", usedVar);
    return 0;
}`
    }
];

export const DEFAULT_CODE = CODE_EXAMPLES[0].code;
