export const CPP_BOILERPLATE_HEADERS = `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <map>
#include <set>
#include <unordered_set>
#include <stack>
#include <queue>
#include <algorithm>
#include <sstream>
#include <cmath>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

ListNode* createList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); i++) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

TreeNode* createTree(const vector<string>& vals) {
    if (vals.empty() || vals[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(vals[0]));
    vector<TreeNode*> q = {root};
    size_t valIdx = 1;
    size_t qIdx = 0;
    while (qIdx < q.size() && valIdx < vals.size()) {
        TreeNode* curr = q[qIdx++];
        if (curr == nullptr) continue;
        
        if (valIdx < vals.size() && vals[valIdx] != "null") {
            curr->left = new TreeNode(stoi(vals[valIdx]));
            q.push_back(curr->left);
        }
        valIdx++;
        
        if (valIdx < vals.size() && vals[valIdx] != "null") {
            curr->right = new TreeNode(stoi(vals[valIdx]));
            q.push_back(curr->right);
        }
        valIdx++;
    }
    return root;
}

template <typename T>
void printVector(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); i++) {
        cout << vec[i] << (i + 1 < vec.size() ? "," : "");
    }
    cout << "]";
}

template <typename T>
void printMatrix(const vector<vector<T>>& mat) {
    cout << "[";
    for (size_t i = 0; i < mat.size(); i++) {
        printVector(mat[i]);
        cout << (i + 1 < mat.size() ? "," : "");
    }
    cout << "]";
}

void printList(ListNode* head) {
    cout << "[";
    ListNode* curr = head;
    while (curr != nullptr) {
        cout << curr->val << (curr->next != nullptr ? "," : "");
        curr = curr->next;
    }
    cout << "]";
}

void printTree(TreeNode* root) {
    if (root == nullptr) {
        cout << "[]";
        return;
    }
    cout << "[";
    vector<TreeNode*> q = {root};
    vector<string> result;
    size_t qIdx = 0;
    
    while (qIdx < q.size()) {
        TreeNode* curr = q[qIdx++];
        if (curr != nullptr) {
            result.push_back(to_string(curr->val));
            q.push_back(curr->left);
            q.push_back(curr->right);
        } else {
            result.push_back("null");
        }
    }
    
    while (!result.empty() && result.back() == "null") {
        result.pop_back();
    }
    
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i] << (i + 1 < result.size() ? "," : "");
    }
    cout << "]";
}
`;
