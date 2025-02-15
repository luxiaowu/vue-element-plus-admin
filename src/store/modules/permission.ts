import { defineStore } from 'pinia'
import { asyncRouterMap, constantRouterMap } from '@/router'
import { generateRoutesFn1, generateRoutesFn2, flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep, keyBy } from 'lodash-es'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'admin' | 'test' | 'none',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        let routerMap: AppRouteRecordRaw[] = []
        if (type === 'admin') {
          // 模拟后端过滤菜单
          routerMap = generateRoutesFn2(routers as AppCustomRouteRecordRaw[])
        } else if (type === 'test') {
          // 模拟前端过滤菜单
          routerMap = generateRoutesFn1(asyncRouterMap, routers?.map((x) => x.path) as string[])

          const titleMap = keyBy(routers, 'path')
          // 重命名
          const setTitle = (arr, path = '') => {
            arr.forEach((x) => {
              const fullPath = [path, x.path].filter(Boolean).join('/')
              // console.log(444, fullPath)
              x.meta.title = titleMap[fullPath]?.title || x.meta.title
              x.fullPath = fullPath
              if (x.children) {
                setTitle(x.children, fullPath)
              }
            })
          }
          setTitle(routerMap)
          // 排序
          const sortFun = (a, b) => {
            if (titleMap[a.fullPath]?.sort && !titleMap[b.fullPath]?.sort) return -1
            if (titleMap[a.fullPath]?.sort && !titleMap[b.fullPath]?.sort) return 1
            return titleMap[b.fullPath]?.sort - titleMap[a.fullPath]?.sort
          }
          const sortMenu = (arr) => {
            arr.sort(sortFun)
            arr.forEach((x) => {
              if (x.children) {
                sortMenu(x.children)
              }
            })
          }
          sortMenu(routerMap)
        } else {
          // 直接读取静态路由表
          routerMap = cloneDeep(asyncRouterMap)
        }
        // 动态路由，404一定要放到最后面
        this.addRouters = routerMap.concat([
          {
            path: '/:path(.*)*',
            redirect: '/404',
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ])
        // 渲染菜单的所有路由
        this.routers = cloneDeep(constantRouterMap).concat(routerMap)
        resolve()
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
